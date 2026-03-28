# Spec

## Detailed Features

### Hybrid Scoring Engine

- Validates incoming user query.
- Calls Exa API to fetch competitor data.
- Calls LLM with strict JSON schema (using `zod-to-json-schema`), enforcing a `_reasoning` prefix for CoT.
- Embeds result via Gemini 768d, L2 normalizes locally, and extracts Vector Uniqueness.
- Calls Apollo API for competitor density, applying a Log-Transformed Saturation Factor capped at 500 competitors for maximum penalty.
- Computes `Niche Viability Score`.

### Continuously Learning Tarpit Flywheel

- Stores user query embeddings in Supabase `pgvector` partitioned tables.
- Periodically extracts vectors into Node.js workers using `SharedArrayBuffer`.
- Executes Spherical K-Means streaming clustering to find tarpit centroids.
- Checks cluster validity via `silhouette_coefficient`.

### False Positive Filter & Source Attribution

- Decomposes idea vector against tarpit centroid to find Orthogonal Vector Distance.
- Queries Local Density (Sub-Market HHI) vs Global Density.
- Attaches verbatim `exa_url` and `exact_quote` to the final object.

## Scenarios

**Scenario 1: Scoring an Idea**

- **WHEN** a user submits an idea
- **THEN** the system generates deterministic features, embeds them, checks uniqueness and competitor density, and calculates the score synchronously.

**Scenario 2: False Positive Tarpit Prevention**

- **WHEN** an idea falls into a Tarpit Cluster centroid
- **AND** the Orthogonal Vector Distance exceeds threshold $\tau$ OR Local Density is near-zero
- **THEN** the system overrides the tarpit penalty, labeling it a defensible wedge.

**Scenario 3: Data Provenance Partition Dropping**

- **WHEN** a data partition reaches its 30-day TTL
- **THEN** the continuous distillation worker completes market archetype upserts
- **AND** the `pg_cron` background job concurrently detaches and drops the partition without blocking the database.
