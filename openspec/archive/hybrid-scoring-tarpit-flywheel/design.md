# Design

## Context

Replacing stochastic evaluations requires processing high-dimensional vectors and third-party data efficiently. Given our Node.js stack, we must avoid the "curse of dimensionality" and premature asynchronous bloat for simple tasks, while enabling deep cluster analysis without expensive external Python ML infrastructure.

## Goals

- Establish an auditable, reproducible scoring mechanism.
- Eliminate tarpit false positives for adjacent niches.
- Ensure zero-downtime data lifecycle management and 30-day compliance.
- Optimize Node.js CPU performance for vector math.

## Non-Goals

- Heavy external ML infrastructure (e.g., AWS Batch, Modal) for MVP.
- Prematurely asynchronous node clustering for synchronous, fast (<2ms) scoring calculations.

## Decisions

- **Vector Dimension Reduction**: Use Gemini `text-embedding-004` to reduce dimensions from 1536 to 768, cutting CPU computational complexity in half.
- **L2-Normalization**: Perform in-place L2 normalization at the edge via loop-unrolled SIMD auto-vectorization before DB insertion.
- **IPC for Workers**: Use `SharedArrayBuffer` for zero-copy memory sharing in the asynchronous Node.js worker pool during clustering.
- **Data Provenance**: Use PostgreSQL `PARTITION BY RANGE` and `pg_partman` for 30-day TTLs. To avoid `ACCESS EXCLUSIVE` locks, use `pg_cron` with `dblink` to detach partitions concurrently.
- **Apollo Normalization**: Apply a Log-Transformed Saturation Factor to Apollo Competitor Counts to prevent linear distortion. We enforce a strict mathematical ceiling of 500 competitors for max saturation penalty, aligning with our hyper-niche viability strategy (where >500 is fundamentally a horizontal tarpit for a micro-SaaS).

## Risks/Trade-offs

- **Math Exceptions**: Missing API data could cause `NaN` or divide-by-zero errors. Strict bounds clamping `[0, 1]` and fallback defaults are mandated.
- **Local Development**: `pgvector` dependencies might block local dev. We will implement fallback `InMemoryCosineEngine` wrappers.

## Future Potential

Once dedicated ML infrastructure is funded, we can migrate the streaming Spherical K-Means to advanced UMAP/HDBSCAN pipelines. The Versioned Heuristic Registry will allow automated A/B testing of the 0.4/0.6 split.
