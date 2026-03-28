-- Create the pgvector extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS vector;

-- Enums
CREATE TYPE data_type_enum AS ENUM ('json', 'markdown', 'image');

-- Main Assets Table (Groups versions together)
CREATE TABLE IF NOT EXISTS raw_data_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    logical_asset_id UUID NOT NULL DEFAULT gen_random_uuid(),
    data_type data_type_enum NOT NULL,
    current_version_id UUID, -- Will point to raw_data_versions(id)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_logical_asset UNIQUE (logical_asset_id)
);

-- Versions Table (Append-only metadata)
CREATE TABLE IF NOT EXISTS raw_data_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES raw_data_assets(id) ON DELETE CASCADE,
    logical_asset_id UUID NOT NULL, -- Denormalized for easier querying
    blob_uri TEXT NOT NULL, -- Pointer to Object Storage
    exact_hash TEXT, -- SHA-256
    perceptual_hash TEXT, -- SimHash or pHash
    embedding vector(1536), -- Assuming OpenAI text-embedding-3-small dimensions. Adjust if using a different model.
    extracted_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID -- Optional user reference
);

-- Circular foreign key update for current_version_id
ALTER TABLE raw_data_assets 
ADD CONSTRAINT fk_current_version 
FOREIGN KEY (current_version_id) 
REFERENCES raw_data_versions(id) 
ON DELETE SET NULL;

-- Inbox Table for Similarity Conflicts
CREATE TABLE IF NOT EXISTS raw_data_inbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pending_data_type data_type_enum NOT NULL,
    pending_blob_uri TEXT NOT NULL,
    pending_exact_hash TEXT,
    pending_perceptual_hash TEXT,
    pending_embedding vector(1536),
    pending_extracted_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    matched_logical_asset_id UUID REFERENCES raw_data_assets(logical_asset_id) ON DELETE CASCADE,
    similarity_score FLOAT NOT NULL, -- The computed score that triggered the inbox
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'resolved_keep_both', 'resolved_update', 'resolved_discard')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID
);

-- Indexes for performance
CREATE INDEX idx_raw_data_versions_asset_id ON raw_data_versions(asset_id);
CREATE INDEX idx_raw_data_versions_exact_hash ON raw_data_versions(exact_hash);
CREATE INDEX idx_raw_data_versions_perceptual_hash ON raw_data_versions(perceptual_hash);
CREATE INDEX idx_raw_data_versions_metadata_gin ON raw_data_versions USING GIN (extracted_metadata);

-- Vector index (IVFFlat or HNSW depending on pgvector version and size. HNSW recommended for newer pgvector)
-- Note: You generally need some data in the table to build an IVFFlat index optimally, but HNSW can be built empty.
-- Assuming pgvector 0.5.0+ and creating an HNSW index for cosine similarity (vector_cosine_ops)
CREATE INDEX idx_raw_data_versions_embedding ON raw_data_versions USING hnsw (embedding vector_cosine_ops);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_raw_data_assets_modtime
    BEFORE UPDATE ON raw_data_assets
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- RLS Policies (Example setup, adjust based on actual auth requirements)
ALTER TABLE raw_data_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_data_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_data_inbox ENABLE ROW LEVEL SECURITY;

-- Allow all for now (Assuming backend service role handles most ops, or configure properly for users)
CREATE POLICY "Allow all on assets" ON raw_data_assets FOR ALL USING (true);
CREATE POLICY "Allow all on versions" ON raw_data_versions FOR ALL USING (true);
CREATE POLICY "Allow all on inbox" ON raw_data_inbox FOR ALL USING (true);
