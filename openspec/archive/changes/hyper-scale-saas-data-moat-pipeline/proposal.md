# Proposal: Hyper-Scale SaaS Data Moat Pipeline - Elite Sources & Architecture Upgrade

## Why

Crawling 100,000 domains using headless browsers (Playwright/Firecrawl) takes weeks and burns massive compute. Synchronous calls to Gemini for 100k domains will instantly trigger `429 Too Many Requests`. Furthermore, traditional databases and firmographics are "noise" that fail to break a founder's reality distortion field. We need "Elite VC-Grade" intelligence (hiring intent, pricing changes, dark social sentiment) but cannot afford $50k+ enterprise API licenses. We must build a high-signal, self-healing pipeline using $0 out-of-pocket, 100% GCP-credit-burnable architecture.

## What Changes

Replaces basic directories and Cloud SQL queues with a **Serverless Extraction & LLM Synthesis (SELS)** architecture. It introduces a **Synthetic Signal Proxy Pattern** to synthesize elite metrics using cheap native GCP proxies (BigQuery Public Datasets, Cloud Run crawlers, Vertex AI Bot). State management moves to Firestore + Pub/Sub to prevent database locking. It introduces a `TenantStrategicVector` ontology to maximize the PLG "Endowment Effect", separating global immutable facts from personalized, user-curated threat vectors.

## Capabilities

- **Cloud Tasks Queue:** 100k+ URLs managed natively via explicit concurrency controls and HTTP rate limiting, preventing Firestore index hotspotting.
- **GCP Native Proxy Stack (The SaaS Oracle V2):** Synthesizes traction (CrUX), hiring intent (Cloud Run scraping `/careers` + Gemini), developer sentiment (BQ GitHub/HN via strict `_PARTITIONTIME` queries), pricing shifts, and API/integration footprints.
- **Organic & GTM Proxies:** Uses Google Programmable Search API (Custom Search API) as a $0 out-of-pocket proxy for indexation size and sponsored ad presence, completely bypassing expensive SEO tools (Ahrefs/SpyFu).
- **Execution Velocity Guardrail:** Leverages 90-to-365-day trailing data in BigQuery to calculate a composite momentum score based on product, ecosystem, and org shifts. Acts as an invisible, binary guardrail during ideation (flagging high-velocity tarpits vs. sleepy blue oceans) to prevent founder analysis paralysis.
- **High-Throughput Crawling:** Event-driven Cloud Run fleet routed through Cloud NAT (using Direct VPC Egress) for IP rotation. Targets specific high-value paths (`/blog`, `/changelog`, `/integrations`) via Vertex AI Search and static scrapers.
- **Batch Extraction & Reconciliation:** Converts payloads to a Standardized Internal Format (SIF) bounded by 10,000 tasks per Cloud Run array execution. Chunks into `.jsonl` files (strictly <50,000 reqs, <1GB) and submits to the Gemini Batch API. A Reconciliation Job handles partial failures via a DLQ.
- **Real-Time Synchronous Fallback:** Executes immediate (Exa -> Gemini Flash) extraction for unseeded hyper-niches to preserve Time-to-Value (TTV).
- **Automated QC:** Random 1% "LLM-as-a-Judge" audits for negative feature penalty and hallucination detection.
- **Market Context Graph Ontology:** Syncs BigQuery SCD Type 2 data to a Vector DB, linking `GlobalMarketFact` to the user's `TenantIdea` via a proprietary, user-curated `TenantStrategicVector` edge in Firestore. Powers a User-Facing Curation UI that translates into external, shareable PLG artifacts.

## Impact

- Time to Market: The foundational dataset is built in under a week, deploying elite intelligence equivalent to a VC hedge fund.
- Cost Efficiency: Slashes compute and LLM costs by >70% through Cloud Run array jobs and the Batch API, keeping out-of-pocket costs at $0.
- Endowment Effect: Founders curate proprietary strategic maps, creating immense lock-in to the NicheAI platform.
