# Raw Data Library

This feature provides a robust, PostgreSQL-backed library for storing, searching, and versioning raw data (JSON, Markdown, Images). It uses multi-stage hashing and vector embeddings for fast similarity detection and presents an Approval Inbox for resolving data conflicts.

## Features

### 1. Ingestion Pipeline & Similarity Detection

- **Requirement:** Asynchronously process new data payloads.
  - Compute SHA-256 for exact match detection.
  - Compute SimHash (text) and pHash (images) for near-duplicate detection.
  - Generate and store vector embeddings (`pgvector`) for semantic search.

### 2. Tabular Metadata Storage

- **Requirement:** Store immutable blobs in Object Storage and queryable metadata in PostgreSQL.
  - Use a JSONB column (`extracted_metadata`) with a GIN index to support high-performance filtering across heterogeneous data types.

### 3. Approval Inbox & Version Resolution

- **Requirement:** Present users with data that triggered a high similarity threshold (but not an exact match).
  - Provide actions: "Keep Both" (fork into a new asset track), "Update" (append as a new version and update pointer), or "Discard".
  - Show side-by-side diffs (JSONDiff, TextDiff, Image sliders) depending on data type.

## Scenarios

- **WHEN** a background worker ingests a JSON payload identical to an existing asset
- **THEN** the system computes the SHA-256 hash, finds a match, and silently discards or logs the duplicate without saving a new blob.

- **WHEN** the system ingests a markdown file that is 95% similar to an existing asset (detected via SimHash)
- **THEN** the new data is placed in the Approval Inbox for the user to review.

- **WHEN** a user clicks "Update" in the Approval Inbox for a text document
- **THEN** the system creates a new `raw_data_versions` row and updates the parent `raw_data_assets` pointer to this new version.

- **WHEN** a user views the Raw Data Library UI
- **THEN** they see a fast, paginated tabular view of all assets, capable of filtering by keys stored in the JSONB metadata column.
