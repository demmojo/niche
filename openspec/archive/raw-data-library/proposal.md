## Why

Currently, the system ingests various types of raw data (API results, website copy, screenshots) but lacks a robust, scalable way to store, compare, and analyze this data. We need a way to quickly identify duplicate or similar data when it's added, allowing users to make informed decisions about whether to update, keep both, or discard the new data. We also need a structured way to view and scan this diverse data in a tabular format.

## What Changes

We are introducing a unified, multi-modal "Raw Data Library" backed by PostgreSQL. This library will handle structured, semi-structured, and unstructured data. It will use advanced hashing (SHA-256, SimHash, pHash) and vector embeddings (`pgvector`) for extremely fast similarity detection. When similar data is found, it will be placed in an asynchronous "Approval Inbox" for user resolution.

## Capabilities

### New Capabilities

- `similarity-detection`: Extremely fast comparison of new raw data against existing data using multi-stage hashing and embeddings.
- `approval-inbox`: An asynchronous queue where users can resolve version conflicts (Keep Both, Update, Discard).
- `tabular-data-view`: A high-performance table view of all raw data metadata, enabled by PostgreSQL JSONB columns and GIN indexing.
- `versioning-engine`: A robust versioning system using SCD Type 2 (Slowly Changing Dimensions) with immutable blob storage.

### Modified Capabilities

- `data-ingestion`: Background workers will now route ingested data through the new similarity detection pipeline before storing.

## Impact

- **Database**: Introduction of PostgreSQL with the `pgvector` extension.
- **Backend**: New Express background worker routes for handling the multi-stage hashing and embedding pipeline.
- **Frontend**: New UI components for the Tabular View and Approval Inbox, including data-specific diffing (JSON diff, text diff, image sliders).
- **Storage**: Immutable object storage (e.g., Supabase Storage) will be used to hold the raw blob payloads.
