## Context

The application needs to store and analyze diverse raw data formats (JSON, Markdown, Images) efficiently. When ingesting data from external sources (like scraping or APIs), we often encounter identical or slightly modified data. We need to avoid storing exact duplicates blindly and provide users with a way to manage versions when data changes slightly. The previous data architecture (Firestore) is not optimized for complex similarity searches or high-performance tabular queries across heterogeneous metadata.

## Goals / Non-Goals

**Goals:**

- Implement extremely fast, low-cost similarity checks (O(1) exact match, fast near-duplicate).
- Store extracted metadata in a queryable tabular format without loading heavy blobs into memory.
- Provide a clear, asynchronous workflow for users to handle conflicting or updated data.
- Ensure all historical data versions are kept and easily rollbackable.

**Non-Goals:**

- Replacing the entire application's primary database (Firestore) immediately; PostgreSQL is being introduced specifically for this library.
- Building a complex, real-time collaborative editing environment for the raw data.

## Decisions

**1. Database Selection: PostgreSQL with pgvector**

- **Decision**: Use PostgreSQL as the metadata and vector storage engine.
- **Rationale**: It provides native support for `pgvector` for semantic similarity, JSONB columns with GIN indexing for fast tabular querying of diverse metadata, and robust relational features for versioning.
- **Alternatives Considered**:
  - _Firestore_: Difficult to do efficient vector search and complex, dynamic tabular filtering across mixed schemas.
  - _Dedicated Vector DB (Pinecone)_: Overkill for our scale; requires managing two separate databases for metadata and vectors.

**2. Hashing Strategy: Multi-Stage Funnel**

- **Decision**: Use SHA-256 for exact matches (JSON), SimHash for near-duplicate text, and pHash for images, before falling back to embeddings.
- **Rationale**: Deterministic algorithms are orders of magnitude faster and cheaper than generating and searching vector embeddings.
- **Alternatives Considered**:
  - _Only Vector Embeddings_: Too slow and expensive for exact or near-exact duplicate detection.

**3. Versioning Pattern: Metadata Pointer (SCD Type 2)**

- **Decision**: Store raw blobs immutably in Object Storage. Use an append-only metadata table where new versions create new rows, and the parent asset points to the `current_version_id`.
- **Rationale**: Makes rollbacks trivial (O(1) pointer update) and ensures data integrity.
- **Alternatives Considered**:
  - _Overwriting data in place_: Destroys history, making rollbacks impossible.

## Risks / Trade-offs

- **Risk: Increased infrastructure complexity** -> We are adding PostgreSQL and an asynchronous worker to the stack.
- **Mitigation**: Use managed services (e.g., Supabase) to handle PostgreSQL and Object Storage deployment and scaling.
