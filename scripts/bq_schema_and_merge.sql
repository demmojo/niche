-- BigQuery Schema Expansion & SCD Type 2 Merge
-- Tracking new synthetic vectors and data lineage

-- Create base table if it doesn't exist
CREATE TABLE IF NOT EXISTS \`${GCP_PROJECT_ID}.saas_oracle.global_market_facts\` (
  domain STRING NOT NULL,
  valid_from TIMESTAMP NOT NULL,
  valid_to TIMESTAMP DEFAULT TIMESTAMP('9999-12-31 23:59:59 UTC'),
  is_active BOOLEAN DEFAULT TRUE,
  
  name STRING,
  website STRING,
  core_features JSON,
  target_audience STRING,
  
  -- New Synthetic Vectors
  engineering_to_sales_ratio FLOAT64,
  integration_count INT64,
  indexation_size INT64,
  sponsored_presence BOOLEAN,
  
  -- Lineage
  prompt_hash STRING,
  model_version STRING,
  gcs_raw_uri STRING,
  ingestion_timestamp TIMESTAMP
)
PARTITION BY DATE(valid_from)
CLUSTER BY domain;

-- Daily MERGE Query for SCD Type 2
-- We assume incoming data is in a staging table \`saas_oracle.market_facts_staging\`

-- 1. Invalidate old records that are being updated
UPDATE \`${GCP_PROJECT_ID}.saas_oracle.global_market_facts\` target
SET 
  valid_to = CURRENT_TIMESTAMP(),
  is_active = FALSE
WHERE 
  target.is_active = TRUE
  AND target.domain IN (SELECT domain FROM \`${GCP_PROJECT_ID}.saas_oracle.market_facts_staging\`);

-- 2. Insert new records
INSERT INTO \`${GCP_PROJECT_ID}.saas_oracle.global_market_facts\`
(
  domain, valid_from, valid_to, is_active, name, website, core_features, target_audience,
  engineering_to_sales_ratio, integration_count, indexation_size, sponsored_presence,
  prompt_hash, model_version, gcs_raw_uri, ingestion_timestamp
)
SELECT
  domain,
  CURRENT_TIMESTAMP() as valid_from,
  TIMESTAMP('9999-12-31 23:59:59 UTC') as valid_to,
  TRUE as is_active,
  name, website, core_features, target_audience,
  engineering_to_sales_ratio, integration_count, indexation_size, sponsored_presence,
  prompt_hash, model_version, gcs_raw_uri, ingestion_timestamp
FROM \`${GCP_PROJECT_ID}.saas_oracle.market_facts_staging\`;


-- 3. Execution Velocity Guardrail Calculation
-- Calculating momentum over the trailing 90-to-365 days using window functions
CREATE OR REPLACE VIEW \`${GCP_PROJECT_ID}.saas_oracle.execution_velocity_metrics\` AS
WITH VelocityWindow AS (
  SELECT 
    domain,
    integration_count,
    indexation_size,
    FIRST_VALUE(integration_count) OVER (PARTITION BY domain ORDER BY valid_from ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as prev_integration_count,
    FIRST_VALUE(indexation_size) OVER (PARTITION BY domain ORDER BY valid_from ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as prev_indexation_size,
    valid_from
  FROM \`${GCP_PROJECT_ID}.saas_oracle.global_market_facts\`
  WHERE valid_from >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 365 DAY)
)
SELECT 
  domain,
  -- Calculate a composite score based on integration growth and indexation growth
  ((integration_count - COALESCE(prev_integration_count, integration_count)) * 2.0) +
  ((indexation_size - COALESCE(prev_indexation_size, indexation_size)) * 0.1) as velocity_score,
  
  -- Expose binary flag for UI
  (((integration_count - COALESCE(prev_integration_count, integration_count)) * 2.0) +
  ((indexation_size - COALESCE(prev_indexation_size, indexation_size)) * 0.1)) > 50 AS is_hyper_velocity_tarpit
FROM VelocityWindow
QUALIFY ROW_NUMBER() OVER (PARTITION BY domain ORDER BY valid_from DESC) = 1;
