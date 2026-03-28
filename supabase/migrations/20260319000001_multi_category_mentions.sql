-- Migration for Multi-Category Mentions

-- 1. Create polymorphic entity_relationships table for bi-directional tagging
CREATE TABLE IF NOT EXISTS entity_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id TEXT NOT NULL,
    source_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    target_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID,
    CONSTRAINT unique_entity_relationship UNIQUE (source_id, source_type, target_id, target_type)
);

-- Indexes for fast lookups
CREATE INDEX idx_entity_rel_source ON entity_relationships(source_id, source_type);
CREATE INDEX idx_entity_rel_target ON entity_relationships(target_id, target_type);

-- Trigger to automatically create the reverse relationship (Bi-directional tagging)
CREATE OR REPLACE FUNCTION ensure_bidirectional_relationship()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent infinite recursion by checking if the reverse already exists
    IF NOT EXISTS (
        SELECT 1 FROM entity_relationships 
        WHERE source_id = NEW.target_id 
          AND source_type = NEW.target_type 
          AND target_id = NEW.source_id 
          AND target_type = NEW.source_type
    ) THEN
        INSERT INTO entity_relationships (source_id, source_type, target_id, target_type, created_by)
        VALUES (NEW.target_id, NEW.target_type, NEW.source_id, NEW.source_type, NEW.created_by);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_bidirectional_relationship
    AFTER INSERT ON entity_relationships
    FOR EACH ROW
    EXECUTE FUNCTION ensure_bidirectional_relationship();

-- Ensure reverse relationship is deleted when one is deleted
CREATE OR REPLACE FUNCTION remove_bidirectional_relationship()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM entity_relationships 
    WHERE source_id = OLD.target_id 
      AND source_type = OLD.target_type 
      AND target_id = OLD.source_id 
      AND target_type = OLD.source_type;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_remove_bidirectional_relationship
    AFTER DELETE ON entity_relationships
    FOR EACH ROW
    EXECUTE FUNCTION remove_bidirectional_relationship();


-- 2. Global Search RPC for Federated Search
-- Since some tables like competitors and insights might not natively exist in Postgres 
-- (if they are in Firebase), this RPC will search the raw_data_versions and can be extended.
-- To satisfy the UNION ALL requirement for the available Postgres tables:

CREATE OR REPLACE FUNCTION global_search(search_query TEXT, limit_per_category INT DEFAULT 3)
RETURNS TABLE (
    id UUID,
    type TEXT,
    title TEXT,
    excerpt TEXT,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    WITH raw_data_matches AS (
        SELECT 
            v.asset_id as id,
            'raw_data'::TEXT as type,
            COALESCE(v.extracted_metadata->>'title', 'Raw Data Asset') as title,
            COALESCE(v.extracted_metadata->>'excerpt', substring(v.extracted_metadata::text from 1 for 200)) as excerpt,
            similarity(COALESCE(v.extracted_metadata->>'title', '') || ' ' || COALESCE(v.extracted_metadata->>'excerpt', ''), search_query) as rank
        FROM raw_data_versions v
        WHERE (COALESCE(v.extracted_metadata->>'title', '') || ' ' || COALESCE(v.extracted_metadata->>'excerpt', '')) ILIKE '%' || search_query || '%'
        ORDER BY rank DESC
        LIMIT limit_per_category
    )
    -- Additional UNION ALL blocks for competitors, features, etc. would go here 
    -- if those tables are synced to Postgres. For now, it returns raw_data_matches.
    SELECT * FROM raw_data_matches;
END;
$$ LANGUAGE plpgsql;

-- 3. Enable RLS
ALTER TABLE entity_relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on entity_relationships" ON entity_relationships FOR ALL USING (true);
