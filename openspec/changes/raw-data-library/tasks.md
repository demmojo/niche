## 1. Setup & Infrastructure

- [x] 1.1 Scaffold OpenSpec feature files (Done)
- [x] 1.2 Initialize PostgreSQL database (e.g., Supabase) and enable the `pgvector` extension.
- [x] 1.3 Create the database schema: `raw_data_assets`, `raw_data_versions`, and inbox tables with JSONB and vector columns.
- [x] 1.4 Set up S3-compatible Object Storage for immutable blobs.

## 2. Backend & Ingestion Pipeline

- [x] 2.1 Build a Node/Express background worker or API route to receive raw data payloads.
- [x] 2.2 Implement the multi-stage hashing functions: SHA-256 for JSON, SimHash for text, pHash for images.
- [x] 2.3 Integrate vector embedding generation (e.g., OpenAI `text-embedding-3-small` or local models) and store in PostgreSQL.
- [x] 2.4 Implement the logic to detect exact matches (discard/log) and near-duplicates (push to Approval Inbox).

## 3. Frontend & UI Integration

- [x] 3.1 Create the Tabular View component (using ag-grid or a custom table) to render and filter the JSONB metadata from PostgreSQL.
- [x] 3.2 Develop the Approval Inbox UI to list pending, similar data.
- [x] 3.3 Implement data-specific diffing components for the Inbox: JSON diff viewer, text diff viewer, and an image before/after slider.
- [x] 3.4 Wire up the Inbox actions ("Keep Both", "Update", "Discard") to the backend versioning API.
