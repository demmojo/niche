# Spec: Hyper-Scale SaaS Data Moat Pipeline - Elite Sources

## Requirements

- **R1:** Massive Seed & Queue via a decoupled Cloud Tasks architecture to handle 100k+ URLs natively with rate limits and backpressure, explicitly avoiding Firestore `status="QUEUED"` antipatterns.
- **R2:** High-Speed Tiered Crawling with Cloud Run and Cloud NAT static IP rotation via Direct VPC Egress; prefix hashing for GCS raw payload buckets to prevent hotspotting.
- **R3:** Batch Extraction & Reliability using Cloud Run Normalization Adapters (max 10,000 executions), Gemini Batch API (strictly chunked <50k lines, <1GB), and a Batch Reconciliation DLQ for partial failures.
- **R4:** Real-Time Synchronous Fallback (Exa -> Gemini Flash) for unseeded searches to preserve immediate Time-to-Value (TTV) without waiting for 24-hour Batch API latency.
- **R5:** Automated QC & Auditing via a Negative Feature Penalty and LLM-as-a-Judge audits.
- **R6:** BigQuery Provenance & Frontend Sync using SCD Type 2 tracking, Native Partitioned Queries (strict `_PARTITIONTIME` filters for public datasets), and a daily Vector Sync Worker to tombstone deleted entities.
- **R7:** The Market Context Graph ontology supporting a User-Facing Curation UI (`TenantStrategicVector`) that powers a PLG acquisition loop via public, shareable competitive teardowns.
- **R8:** The SaaS Oracle V2 Expansion: Synthesis of firmographic hiring ratios, API integration footprints, content pivots, and organic visibility strictly using GCP-native proxies (Cloud Run targeting `/careers`, `/integrations`; Vertex AI Search on `/blog`; and Google Programmable Search API) to maintain a $0 out-of-pocket constraint.
- **R9:** Execution Velocity Guardrail: Calculation of a composite momentum score based on trailing 90-to-365-day BigQuery SCD Type 2 data. Exposed strictly as a binary guardrail in the ideation UI (e.g., flagging tarpits) to prevent analytical bloat.

## Scenarios

**Scenario 1: Domain Ingestion & Dispatch**

- **GIVEN** XML sitemaps or Crunchbase canonical URLs
- **WHEN** the seed script executes
- **THEN** 100k+ URLs are extracted and dispatched into a master **Cloud Tasks queue** with strict concurrency controls
- **AND** the tasks are partitioned by domain hash and staggered via `scheduleTime` to prevent Firestore index hotspotting.

**Scenario 2: Tiered Crawling & IP Rotation**

- **GIVEN** a batch of domains triggered by Cloud Tasks
- **WHEN** the static crawler on Cloud Run attempts a fetch via Cloud NAT (Direct VPC Egress) targeting specific paths (`/careers`, `/integrations`, `/changelog`)
- **THEN** on success, dump raw payload to GCS with a hashed prefix
- **AND** on SPA/Bot-wall, explicitly return 429/403 to trigger Cloud Tasks backpressure and retry later on the Firecrawl Spot VM fleet.

**Scenario 3: Synthetic SEO & Content Pivot Extraction**

- **GIVEN** a scheduled crawl target in the SaaS universe
- **WHEN** the Normalization Adapter Layer is invoked
- **THEN** Vertex AI Search crawls the `/blog` subdirectory
- **AND** the Google Programmable Search API evaluates total indexation size and sponsored ad presence
- **AND** Gemini synthesizes this metadata to detect messaging pivots and organic dominance defensibility.

**Scenario 4: Real-Time Synchronous Fallback (TTV preservation)**

- **GIVEN** a user queries a hyper-niche that is not present in the pre-computed Vector DB
- **WHEN** the API returns a cache-miss
- **THEN** execute a synchronous (Exa -> Gemini Flash) extraction path to instantly populate the User Curation UI
- **AND** a Circuit Breaker monitors Exa. If Exa fails 3 consecutive times in a 5-minute window, the synchronous extraction disables itself and falls back to a graceful UI state.

**Scenario 5: Batch Execution & Reconciliation**

- **GIVEN** heterogeneous raw payloads in GCS (`gs://lake/raw-payloads/`)
- **WHEN** the daily Normalization Adapter Job runs (bounded to max 10,000 tasks per execution)
- **THEN** chunk payloads by `_PARTITIONTIME` bucket + schema type into `.jsonl` files
- **AND** submit to Gemini Batch API (capping concurrent submissions to 80% of quota)
- **AND** the Batch Reconciliation Job parses errors, merging successful batches into GCS Silver Lake
- **AND** routes partial failures through a **Synchronous Zod Self-Correction Loop** (max 2 retries) which explicitly prepends the Zod schema violations and example outputs into the retry prompt before routing unrecoverable tasks to the DLQ with exponential backoff (1m -> 5m -> 30m).

**Scenario 6: Quality Control**

- **GIVEN** a completed and reconciled Gemini Batch API extraction
- **WHEN** the validation script runs
- **THEN** apply **Stratified Sampling** (targeting low confidence records, high variance, and a baseline of passed records to avoid negative bias) for `gemini-3.1-pro` grading
- **AND** the LLM-as-a-Judge validates missing required fields, hallucinated nested objects (using `verbatimQuotes`), and semantic inconsistency (Negative Feature Penalty).
- **AND** quarantines low-scoring payloads to the DLQ instead of halting the pipeline.

**Scenario 7: BigQuery Lineage & Vector Sync**

- **GIVEN** validated extractions in the GCS Silver Lake
- **WHEN** the nightly sync pipeline runs
- **THEN** merge records into BigQuery SCD Type 2 tracking `ingestion_timestamp`, `prompt_hash`, `model_version`, and `gcs_raw_uri`
- **AND** calculate the composite `ExecutionVelocityScore` using window functions over the trailing 90-to-365 days
- **AND** the Vector Sync Worker fetches latest active records (including velocity flags), bulk upserts to the Vector DB, and explicitly sends `DELETE` commands for ghost companies.
