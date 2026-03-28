# Tasks

## Phase 1: Hybrid Scoring Engine (Synchronous)

- [x] Implement `scoringRoutes.ts` with Exa API integration for competitor HTML/text.
- [x] Enforce strict LLM JSON parsing with a `_reasoning` CoT field.
- [x] Implement Gemini `text-embedding-004` integration (768D).
- [x] Implement local L2-normalization loop-unrolled SIMD before DB storage.
- [x] Implement Vector Uniqueness and Apollo Competitor Count log-transformed normalization math.
- [x] Calculate `Niche Viability Score` using `(Uniqueness * 0.4) + (Apollo * 0.6)`.

## Phase 2: Asynchronous Data Flywheel

- [x] Create Supabase `tarpit_queries` table with `vector(768)` and `PARTITION BY RANGE`.
- [x] Modify API to asynchronously insert user embeddings into the `pgvector` table.
- [x] Implement Node.js worker pool (`piscina`) with `SharedArrayBuffer` zero-copy IPC.
- [x] Implement streaming Spherical K-Means clustering algorithm using pure Inner Product.
- [x] Add cluster monitoring logic (`silhouette_coefficient`).

## Phase 3: False Positive Filtering & Logging

- [x] Implement Orthogonal Vector Distance calculation.
- [x] Implement Local Density vs Global Density checks to override false tarpit flags.
- [x] Add explicit Source Record Attribution (`exa_url` and `exact_quote` mapping) to outputs.
- [x] Establish a Git-tracked Versioned Heuristic Registry.

## Phase 4: Visual Intelligence & Deduplication Refactoring

- [x] Refactor Visual Intelligence Pipeline to output strict JSON with `_reasoning` fields instead of raw multimodal generation.
- [x] Map visual JSON features through deterministic vector mapping scripts.
- [x] Wire existing SimHash deduplication logic into the new ingestion pipelines.

## Phase 5: Data Lifecycle & Distillation

- [x] Update `raw_data_assets` using `PARTITION BY RANGE (created_at)`.
- [x] Configure `pg_partman` and create `pg_cron` func for `ALTER TABLE ... DETACH PARTITION CONCURRENTLY`.
- [x] Implement asynchronous Continuous Distillation Worker with `last_processed_id` watermark.
- [x] Add native S3 Lifecycle rules for raw blobs.
