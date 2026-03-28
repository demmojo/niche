# Deduplication Algorithm

The deduplication algorithm ensures that the raw data library remains clean by accurately linking incoming data to existing logical assets, or routing ambiguous matches to the Task Inbox for manual review.

## Features

### 1. Tri-Tiered Matching Pipeline

- **Requirement:** The ingestion service MUST first hash the normalized payload (SHA-256) and check for an exact match.
- **Requirement:** If no exact match, the service MUST check for a perceptual/lexical match (e.g., Hamming distance on SimHash).
- **Requirement:** If no fuzzy match, the service MUST compute vector embeddings and perform a semantic search.

### 2. Thresholding Logic

- **Requirement:** The system MUST automatically link incoming data to an existing asset if the cosine similarity score is `>= 0.98`.
- **Requirement:** The system MUST route the data to the `raw_data_inbox` if the score is `>= 0.85` and `< 0.98`.
- **Requirement:** The system MUST create a new `raw_data_assets` row if the score is `< 0.85`.

### 3. Similarity Engine Interface & Degradation

- **Requirement:** The system MUST use an `ISimilarityEngine` interface to perform the semantic search step.
- **Requirement:** In production, `PgVectorEngine` MUST be used to execute the search via Supabase/Postgres RPC calls.
- **Requirement:** In local environments without `pgvector`, the system MUST fall back to `InMemoryCosineEngine` or `LexicalFallbackEngine`.

## Scenarios

- **WHEN** a perfectly identical JSON payload is ingested
- **THEN** Tier 1 (Exact Match) catches it via SHA-256 and silently links/discards it without generating an embedding.

- **WHEN** a payload with a semantic similarity of 0.92 is ingested
- **THEN** it bypasses Tiers 1 & 2, hits Tier 3, and is routed to the Task Inbox for manual review.

- **WHEN** the application is run locally without Supabase `pgvector`
- **THEN** the `InMemoryCosineEngine` fetches a blocked subset of records and computes the similarities in TypeScript, ensuring the ingestion flow still works.
