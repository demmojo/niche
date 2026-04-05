# Tasks: Hyper-Scale SaaS Data Moat Pipeline - Elite Sources

## Phase 1: Massive Seed & Cloud Tasks Queue

- [x] Create `scripts/seed-domains.ts`.
- [x] Parse XML sitemaps and Crunchbase/CommonCrawl canonical URLs.
- [x] Dispatch URLs into a master **Cloud Tasks queue** configured with strict rate limits.
- [x] Partition the queue by domain hash and stagger ingestion using `scheduleTime` to prevent Firestore index hotspotting.

## Phase 2: Blazing-Fast Targeted Crawling Fleet & Proxy Stack

- [x] Create `src/server/workers/staticCrawlerWorker.ts` deployed on event-driven Cloud Run. Target specific high-signal paths (`/careers`, `/changelog`, `/integrations`) instead of scanning full domains.
- [x] Configure **Direct VPC Egress** and Cloud NAT for a pool of 50+ static outbound IPs (explicitly avoiding legacy Serverless VPC Access connectors).
- [x] Implement prefix hashing when writing to GCS `gs://lake/raw-payloads/` to prevent partition hotspotting.
- [x] Implement SPA/403 fallback to Cloud Tasks queue (with strict backpressure) for Firecrawl Spot VMs.
- [x] Set up **Native Partitioned Queries** in BigQuery for `githubarchive`, `hacker_news`, and `CrUX`, enforcing strict `_PARTITIONTIME` filters to prevent massive query costs.
- [x] **Configure Google Programmable Search API:** Use GCP's Custom Search API to proxy indexation size and sponsored ad presence without expensive SEO tools. Integrate this into the Normalization Adapter Layer.
- [x] Implement a **Real-Time Synchronous Fallback** (Exa -> Gemini Flash) for unseeded hyper-niches to preserve immediate Time-to-Value (TTV).
- [x] Add a **Circuit Breaker** to the Exa Synchronous Fallback (e.g., 3 consecutive Exa failures in a 5-min window disables Exa to prevent cascading latency).

## Phase 3: Cloud Run Jobs & Gemini Batch Extraction

- [x] Create `src/server/workers/normalizationAdapterJob.ts`.
- [x] Implement Normalization Adapter Layer in Cloud Run, strictly bounding array executions to a maximum of 10,000 tasks per execution to align with GCP limits.
- [x] **Update Gemini Prompt Schemas:** Modify `aiSchemas.ts` to accurately extract firmographic hiring ratios, integrations footprints, ICP shifts, and GTM motions from the raw targeted payloads.
- [x] Chunk SIF outputs into `.jsonl` files (strictly under 50,000 requests and 1GB per file) by **`_PARTITIONTIME` bucket + schema type** to align batch boundaries with freshness epochs.
- [x] Cap Gemini Batch API concurrent submissions to 80% of quota.
- [x] Create `src/server/workers/batchReconciliationJob.ts`.
- [x] Implement a **Synchronous Zod Self-Correction Loop** (max 2 retries on Gemini Flash) before routing unrecoverable JSON payloads to the DLQ.
- [x] Add a **Structured Error Feedback loop** to Zod Self-Correction (prepending schema violations and example outputs into the retry prompt).
- [x] Implement **Exponential Backoff** (1m -> 5m -> 30m) before manual review when routing items to the DLQ.

## Phase 4: Automated QC, Auditing & The Market Context Graph UI

- [x] Create `src/server/workers/auditWorker.ts`.
- [x] Implement **Stratified Sampling** (targeting edge-cases, low confidence scores, and schema drifts) for `gemini-3.1-pro` audits. Include a small baseline of _passed_ checks to prevent negative bias.
- [x] Enforce the Negative Feature Penalty by evaluating missing required fields, hallucinated nested objects, and Semantic Inconsistencies (e.g., `targetAudience: "enterprise"` vs `pricing: "free"`).
- [x] Implement the `TenantStrategicVector` edge schema in Firestore, connecting `GlobalMarketFact` to the user's `TenantIdea`.
- [x] **Endowment Effect UI:** Modify `src/components/TrustBuilderScreen.tsx` and `src/components/CompetitorDiscoveryModal.tsx` to build the user-facing curation UI where founders refine their proprietary threat model.
- [x] **PLG Acquisition Loop:** Design logic to convert curated intelligence into external, shareable artifacts (e.g., public competitive teardowns).

## Phase 5: BigQuery Lineage & Vector Sync

- [x] **Expand BigQuery Schema:** Update the Data Moat schemas to include new synthetic vectors (`engineering_to_sales_ratio`, `integration_count`, `indexation_size`, `sponsored_presence`).
- [x] Implement daily `MERGE` query into massive SCD Type 2 BigQuery table tracking data lineage (prompt hash, model version, raw URI).
- [x] **Implement Execution Velocity Guardrail:** Create BigQuery SQL queries using window functions to calculate the composite `ExecutionVelocityScore` (trailing 90-to-365 days). Expose this as a binary flag (e.g., `is_hyper_velocity_tarpit`).
- [x] Create `src/server/workers/vectorSyncWorker.ts`.
- [x] Run the Vector Sync Worker daily after BigQuery merges, executing bulk upserts (including velocity flags) and explicit delete (tombstoning) commands to the Vector DB.
- [x] Modify frontend/scoring routes to query the Vector DB strictly for low-latency retrieval, surfacing velocity guardrails during ideation.
