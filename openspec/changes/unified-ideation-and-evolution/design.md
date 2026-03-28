## Context

This design defines the technical architecture for the "Unified Ideation & Evolution Engine," reconciling the overlapping features of the `ideation-workflow` and `product-evolution-engine` proposals. It focuses on resolving the primary risks of early-stage SaaS ideation: Analysis Paralysis and Feature Bloat.

The architecture emphasizes asynchronous processing, ensuring heavy tasks (scraping, OCR, semantic extraction) don't block the UI. A primary objective is building an "optimistic" flow using a real-time Server-Sent Events (SSE) DAG UI. The backend relies heavily on BullMQ and Redis for durable queuing. We also address a logical inconsistency by mandating client-side perceptual hashing for image deduplication _before_ Supabase upload.

## Goals / Non-Goals

**Goals:**

- Build an intent-based onboarding flow that asks exactly 1 branching question at zero-state.
- Ingest up to 5 competitor URLs asynchronously, showing a live "AI Thinking" DAG.
- Develop a Tinder-style swipe UI for curating the "Hybrid Product", keeping cognitive load minimal.
- Implement an MVP Budgeting progress bar that provides "color-coded friction" at the 30-day development effort limit.
- Deduplicate images client-side using a Difference Hash (dHash) before hitting cloud storage.
- Enforce strict verbatim RAG with a 3-tier validation waterfall to prevent LLM quote hallucinations.

**Non-Goals:**

- Generating actual product code (this remains in the "Fake Door" or generative UI scope outside this ideation flow).
- Replacing the standard manual entry for power users (the "Advanced Setup" will remain accessible, but hidden initially).
- Supporting deep, arbitrary multi-modal conversational chat during the initial Tinder swipe (the interaction is binary by design).

## Decisions

**1. Asynchronous Job Processing with BullMQ**

- **Decision**: Decouple the ideation process using a Command Query Responsibility Segregation (CQRS) pattern with BullMQ and Redis.
- **Rationale**: Scraping 5 competitor sites and running Vision ML models is highly I/O and compute-bound. Blocking the main thread or HTTP response will cause timeouts and terrible UX. BullMQ provides durable queues, retries, and parent-child dependencies.
- **Alternatives Considered**:
  - _Direct HTTP Calls_: Unacceptable UX; would frequently hit Vercel/Cloudflare timeout limits.
  - _Supabase Edge Functions without a queue_: Still subject to timeouts for heavy scraping tasks; lacks complex retry logic and backoff jitter.

**2. Real-Time UI via Server-Sent Events (SSE) with Redis Streams**

- **Decision**: Stream BullMQ job progress (active, completed, failed) to the frontend's "AI Thinking DAG" using SSE, backed by Redis Streams (`XADD`/`XREAD`) for state resumption.
- **Rationale**: WebSockets are overkill and stateful. SSE is perfect for unidirectional status updates. Redis Streams are critical because load balancers drop idle SSE connections; the client must be able to resume with `Last-Event-ID` without missing DAG node updates.
- **Alternatives Considered**:
  - _Long Polling_: Too much overhead; creates a choppy UI experience for a rapidly updating DAG.
  - _WebSockets_: Unnecessary bidirectional overhead; harder to scale horizontally without sticky sessions.

**3. Client-Side Image Deduplication (dHash)**

- **Decision**: Compute a 64-bit Difference Hash (dHash) using an `OffscreenCanvas` inside a Web Worker on the client before uploading to Supabase Storage.
- **Rationale**: Resolves the inconsistency where `raw-data-image-storage` uploads images immediately, defeating the `deduplication-algorithm`. A Web Worker prevents main-thread jank. dHash is robust against resizing and minor compression, unlike cryptographic hashes (SHA-256).
- **Alternatives Considered**:
  - _Server-Side Hashing_: Wastes bandwidth and cloud storage if the image is a duplicate.
  - _Main-Thread Hashing_: Will freeze the browser while processing high-res images, ruining the onboarding UX.

**4. 3-Tier Validation Waterfall for Verbatim RAG**

- **Decision**: Implement a Strict -> Normalized -> Fuzzy fallback mechanism for validating LLM-extracted `exact_quote` strings.
- **Rationale**: LLMs frequently hallucinate whitespace, punctuation, or smart quotes when asked to extract verbatim text. A simple `quote in source` check fails too often. The waterfall ensures high recall while maintaining data provenance.

## Risks / Trade-offs

- **Risk: SSE Connection Drops & Freezing UI** -> Load balancers (e.g., Cloudflare) aggressively kill idle connections, potentially freezing the optimistic DAG.
- **Mitigation**: Implement a backend heartbeat comment (`:\n\n`) every 15 seconds. Rely on the Redis Streams state resumption (`Last-Event-ID`) for robust client reconnects.

- **Risk: Redis OOM (Out of Memory)** -> High volume of BullMQ jobs and SSE streams could crash Redis.
- **Mitigation**: Enforce aggressive `removeOnComplete: true` and `removeOnFail: { age: 3600 }` policies on all queues. Cap Redis Stream length (`MAXLEN ~1000`).

- **Risk: Thundering Herd from Exa Rate Limits** -> If Exa rate-limits scraping, all jobs retrying simultaneously will crash the system.
- **Mitigation**: Implement "Full Jitter" exponential backoff in BullMQ and a Circuit Breaker that pauses the queue if >10 jobs fail consecutively with HTTP 503.
