# Design: Hyper-Scale SaaS Data Moat Pipeline - Elite Sources

## Context

Current logic uses basic directory scraping and Exa retrieval. We are radically overhauling the pipeline to power an AI Co-Founder that guides startups away from "tarpits." The requirement is to build "Elite VC-Grade" intelligence without $50k+ enterprise API licenses, strictly adhering to the "binary triage" anti-bloat philosophy using 100% GCP-burnable architecture.

## Goals & Non-Goals

**Goals:**

- Process 100k+ domains in 24-48 hours using scalable, event-driven pipelines.
- Synthesize elite alternative data vectors (hiring intent, dark social sentiment, dynamic pricing shifts) entirely through GCP-native proxies.
- Guarantee enterprise-grade data quality and provide exact lineage (BigQuery SCD Type 2).
- Establish the `TenantStrategicVector` graph to maximize the PLG "Endowment Effect".

**Non-Goals:**

- Direct Enterprise API Integrations (e.g., Earnest, Autobound, SpyFu).
- Complex streaming tools (GCP Dataflow/Apache Beam).
- Vanity Firmographics (Total funding, overall headcount).
- Real-time streaming inserts into BigQuery OLAP tables.

## Decisions

1. **Cloud Tasks Queue:** Replaces Pub/Sub + Firestore `QUEUED` state updates. Managing 100k+ high-frequency status transitions in Firestore causes index hotspotting. Cloud Tasks natively provides explicit concurrency controls, HTTP rate limiting, and dispatch rules. To prevent index contention, the queue must be partitioned by domain hash and staggered using `scheduleTime`.
2. **Static-First Targeted Crawling (Cloud Run + Direct VPC Egress):** Deploy HTTP crawlers on event-driven Cloud Run. To map firmographic shifts, integrations, and content pivots without scanning full domains, the crawler strictly targets high-signal paths: `/careers`, `/changelog`, `/integrations`, and `/blog` (the latter via Vertex AI Search). Route outbound traffic via Cloud NAT with 50+ static IPs (using Direct VPC Egress instead of legacy Serverless VPC connectors) to avoid bot-bans. Dump to `gs://lake/raw-payloads/` using **prefix hashing** to avoid GCS hotspotting.
3. **Native Partitioned Queries (BigQuery Proxy):** Use BigQuery Public Datasets (CrUX, GitHub Archive, Hacker News) and Cloud Run web scraping to synthesize complex signals. We strictly enforce `_PARTITIONTIME` filters to prevent runaway query costs on massive datasets. Pass to a "Normalization Adapter Layer" Cloud Run job that converts HTML/JSON into a Standardized Internal Format (SIF).
4. **Organic & GTM Proxy Execution (Google Custom Search API):** We explicitly reject $50k/yr SEO/Ads APIs (Ahrefs, Semrush, SpyFu) to maintain our 100% GCP-credit-burnable constraint. We will proxy indexation size, domain dominance, and sponsored ad keyword presence using the Google Programmable Search Engine API (billed natively to GCP).

## 5. Cloud Run Array Jobs & Batch API (Orchestration)

Compile SIF files into chunked `.jsonl` files. Crucially, these files are chunked by **`_PARTITIONTIME` bucket + schema type** (not just raw request count) to align batch boundaries with logical data freshness epochs, simplifying replay failures. Cloud Run array jobs are bounded to a maximum of 10,000 tasks. We set the Gemini Batch API max concurrent submissions to 80% of our total GCP quota to prevent cross-project bottlenecks. A dedicated `Batch Reconciliation Job` routes parsing failures to a **Synchronous Zod Self-Correction Loop**. This loop includes a **Structured Error Feedback mechanism**: on parse failure, it prepends the specific Zod schema violations and an example corrected output to the retry prompt. It is strictly bounded to a max of 2 retries on Gemini Flash. Unrecoverable failures route to a Dead Letter Queue (DLQ) configured with exponential backoff (1m -> 5m -> 30m).

## 6. Embedding Strategy & Vertex AI Vector Search

We decouple raw text from the embedding space. We **strictly embed the structured JSON** outputs (e.g., `coreFeatures`, `targetAudience`), applying Semantic Chunking rather than embedding raw, noisy markdown. This reduces vector contamination. Furthermore, all vectors must be injected with SCD Type 2 metadata (e.g., `valid_from`, `industry_segment`) to enforce strict **Metadata Filtering** during Vertex AI retrieval, bypassing nearest-neighbor search degradation across unrelated markets.

## 7. LLM-as-a-Judge & Quality Control

A nightly audit uses `gemini-3.1-pro` with a strict rubric implementing a **Negative Feature Penalty**. The rubric explicitly evaluates: (1) Missing required fields, (2) Hallucinated nested objects (checking `verbatimQuotes` vs. raw HTML payloads), and (3) **Semantic Inconsistency** (e.g., `targetAudience: "enterprise"` but `pricing: "free"`).

Rather than a naive 1% random sample, we employ **Stratified Sampling**. The audit prioritizes records with high perplexity, low confidence scores, or newly detected schemas. Crucially, the stratified sample **must include a small baseline of passed checks** (high confidence) to prevent sampling bias from skewing the aggregate quality metrics.

## 8. Real-Time Synchronous Fallback

The Batch API latency (24+ hr) breaks immediate Time-to-Value (TTV) for newly discovered hyper-niches. For unseeded searches, we route through a synchronous fallback (Exa -> Gemini Flash) to preserve the immediate "wow" moment. To prevent latency cascades, this fallback implements a **Circuit Breaker**: if Exa fails 3 consecutive times in a 5-minute window, the synchronous extraction is disabled, falling back to a graceful degraded UI state.

## 9. Vector Sync, Tombstoning, & Execution Velocity Guardrail

A daily `Vector Sync Worker` bridges BigQuery staging to the Vector DB. It performs bulk upserts of latest active records and explicitly sends `DELETE` commands for ghost companies. It also leverages trailing 90-to-365-day BigQuery SCD Type 2 windows to calculate a composite **Execution Velocity Score** (product, org, and ecosystem momentum). This is used as an invisible binary guardrail in the UI (warning against high-velocity tarpits) rather than a vanity dashboard, adhering strictly to anti-bloat principles.

## 10. Market Context Graph Ontology & Endowment UI

Store immutable facts as a `GlobalMarketFact`. Link it to the user's `TenantIdea` via a stateful `TenantStrategicVector` edge. The **Endowment Effect UI** allows founders to curate their specific competitive landscape, which directly drives a **PLG Acquisition Loop** through public, shareable competitive teardowns.

## Risks & Trade-offs

- **Proxy Data Drift:** Synthetic signals from Reddit/GitHub might not perfectly correlate with actual financial metrics (credit card spend). _Mitigation:_ Continually benchmark against internal ML validation heuristics.
- **Batch API Latency:** Can take 24+ hours. _Mitigation:_ Decouple pipeline with GCS event triggers.
- **Schema Evolution:** Heterogeneous sources will evolve. _Mitigation:_ Enforce strict Zod schemas at the Normalization Adapter Boundary. Route parsing failures to the DLQ.
