CREATE TABLE IF NOT EXISTS raw_data_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_version_id UUID NOT NULL REFERENCES raw_data_versions(id) ON DELETE CASCADE,
    logical_asset_id UUID NOT NULL REFERENCES raw_data_assets(logical_asset_id) ON DELETE CASCADE,
    metric_name VARCHAR(255) NOT NULL,
    value JSONB NOT NULL, -- Storing as JSONB to support strings, numbers, or complex objects
    source_id VARCHAR(255), -- Reference to the originating DataSource id (using VARCHAR as DataSource ID is string)
    ai_confidence_score INTEGER CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 100),
    static_source_weight INTEGER CHECK (static_source_weight >= 0 AND static_source_weight <= 100),
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_raw_data_metrics_logical_asset ON raw_data_metrics(logical_asset_id);
CREATE INDEX idx_raw_data_metrics_name ON raw_data_metrics(metric_name);

ALTER TABLE raw_data_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on raw_data_metrics" ON raw_data_metrics FOR ALL USING (true);
