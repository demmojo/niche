## Context

To maintain a clean Raw Data Library, we need a robust algorithm to deduplicate incoming data. Using only vector embeddings is computationally expensive and prone to false positives on exact matches. Furthermore, requiring `pgvector` locally creates friction for developers who just want to test basic ingestion or UI flows.

## Goals / Non-Goals

**Goals:**

- Implement a Tri-Tiered Waterfall Matching Strategy (Exact, Fuzzy, Semantic).
- Define clear similarity score thresholds for auto-merging vs. manual review.
- Abstract the similarity search behind an `ISimilarityEngine` interface.
- Implement graceful degradation for local environments without `pgvector`.

**Non-Goals:**

- Building our own custom embedding models (we will continue to use OpenAI/Gemini embeddings).
- Implementing complex graph-based entity resolution for this initial iteration.

## Decisions

**1. The Tri-Tiered Pipeline**

- **Decision**: Evaluate candidates sequentially: Tier 1 (Exact SHA-256), Tier 2 (Perceptual/Lexical pHash/SimHash/BM25), Tier 3 (Semantic Cosine Similarity).
- **Rationale**: This filters out obvious duplicates cheaply and precisely before doing expensive vector math.

**2. Thresholding & Inbox Routing**

- **Decision**:
  - `Score >= 0.98`: Auto-Merge (Semantic identity assumed).
  - `0.85 <= Score < 0.98`: Route to `raw_data_inbox` (Human-in-the-Loop review).
  - `Score < 0.85`: Distinct asset (Create new).
- **Rationale**: Prevents inbox fatigue by only asking humans to review ambiguous, edge-case matches.

**3. Graceful Environment Degradation**

- **Decision**: Implement an `ISimilarityEngine` interface governed by a feature flag (e.g., checking if `pgvector` exists or an env var).
- **Rationale**:
  - _Production (`PgVectorEngine`)_: Uses `pgvector`'s `<=>` operator natively.
  - _Local Fallback 1 (`InMemoryCosineEngine`)_: If `pgvector` is missing but embeddings exist, fetch candidates by `data_type` and calculate cosine similarity in memory.
  - _Local Fallback 2 (`LexicalFallbackEngine`)_: If embedding generation is disabled locally, rely strictly on Tier 1 and Tier 2.

## Risks / Trade-offs

- **Risk: In-Memory Bottleneck Locally** -> Fetching thousands of embeddings into Node.js memory locally could crash the process.
- **Mitigation**: Implement "Blocking" (pre-filtering by `data_type` and date windows) to limit the candidate pool to a maximum of ~1000 records before doing in-memory math.
