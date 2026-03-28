## 1. Core Interfaces & Engine Setup

- [ ] 1.1 Define the `ISimilarityEngine` interface and the candidate response types.
- [ ] 1.2 Implement the `PgVectorEngine` class that utilizes Supabase RPC functions for `pgvector` cosine distance.
- [ ] 1.3 Implement the `InMemoryCosineEngine` class with a basic cosine similarity math function.
- [ ] 1.4 Implement the `LexicalFallbackEngine` class for environments where embeddings are disabled.
- [ ] 1.5 Create a factory function (`getSimilarityEngine`) that detects the environment and returns the appropriate engine instance.

## 2. Pipeline Implementation

- [ ] 2.1 Implement the normalization and hashing utilities (SHA-256, SimHash/pHash) in `utils/hashing.ts`.
- [ ] 2.2 Build the main `processIncomingData` ingestion function.
- [ ] 2.3 Implement Tier 1 (Exact Match) lookup logic.
- [ ] 2.4 Implement Tier 2 (Fuzzy Lexical) lookup logic.
- [ ] 2.5 Implement Tier 3 (Semantic Vector) lookup logic using the injected `ISimilarityEngine`.

## 3. Thresholding & Routing

- [ ] 3.1 Implement the routing switch statement based on the Tier 3 score (`>= 0.98` Auto-merge, `0.85-0.97` Inbox, `< 0.85` New Asset).
- [ ] 3.2 Write unit tests for the ingestion pipeline mocking the `ISimilarityEngine` to ensure correct routing based on simulated scores.
