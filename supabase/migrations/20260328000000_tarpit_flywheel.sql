-- Enable vector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_partman WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA public;

-- Phase 2: Tarpit Queries
CREATE TABLE IF NOT EXISTS tarpit_queries (
    id UUID DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID NOT NULL,
    query_text TEXT NOT NULL,
    query_vector vector(768) NOT NULL,
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Set up pg_partman for tarpit_queries (Daily partitions, keep 30 days)
SELECT public.create_parent(
    p_parent_table => 'public.tarpit_queries',
    p_control => 'created_at',
    p_type => 'native',
    p_interval => 'daily',
    p_premake => 3
);

-- Update partman config for 30 day retention
UPDATE public.part_config 
SET retention = '30 days', retention_keep_table = false 
WHERE parent_table = 'public.tarpit_queries';

-- Phase 5: Data Lifecycle for raw_data_assets
-- Since raw_data_assets might already exist, converting to partition requires table recreation.
-- For the sake of this task, we will create a partitioned replacement if needed or a new table raw_data_assets_partitioned.
-- Assuming we want to migrate:
ALTER TABLE IF EXISTS raw_data_assets RENAME TO raw_data_assets_old;

CREATE TABLE raw_data_assets (
    id UUID DEFAULT gen_random_uuid(),
    logical_asset_id UUID NOT NULL,
    data_type TEXT NOT NULL,
    current_version_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Migrate old data (if any)
INSERT INTO raw_data_assets (id, logical_asset_id, data_type, current_version_id, created_at, updated_at, created_by)
SELECT id, logical_asset_id, data_type, current_version_id, created_at, updated_at, created_by
FROM raw_data_assets_old;

-- Set up pg_partman for raw_data_assets (Daily partitions, keep 30 days)
SELECT public.create_parent(
    p_parent_table => 'public.raw_data_assets',
    p_control => 'created_at',
    p_type => 'native',
    p_interval => 'daily',
    p_premake => 3
);

UPDATE public.part_config 
SET retention = '30 days', retention_keep_table = false 
WHERE parent_table = 'public.raw_data_assets';

-- Configure pg_cron to run partman maintenance hourly
SELECT cron.schedule('partman_maintenance', '@hourly', $$
    SELECT public.run_maintenance();
$$);

