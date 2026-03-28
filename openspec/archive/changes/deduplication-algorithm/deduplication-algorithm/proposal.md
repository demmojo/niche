## Why

> **NOTICE:** This spec has been **superseded** by `raw-data-library`.

The current deduplication logic for raw data ingestion needs to be formalized to ensure high data quality. We must reliably identify when incoming raw data (competitor data, scraped content, images) is identical, slightly modified, or semantically similar to existing records. Furthermore, this logic must degrade gracefully in local development environments where Supabase and `pgvector` might not be available, ensuring developers can still test ingestion flows without a full production database setup.

## What Changes

We are formalizing a Tri-Tiered Waterfall Matching Strategy (Exact Match, Perceptual/Lexical Match, and Semantic Match) to identify related raw data items. We are also introducing a thresholding system to automatically merge high-confidence duplicates, route medium-confidence matches to the Approval Inbox, and create new assets for low-confidence matches.

Finally, we are introducing a strategy pattern (`ISimilarityEngine`) to allow the application to gracefully degrade its matching capabilities based on the availability of `pgvector` and the embedding generation API.

## Capabilities

### New Capabilities

- `tri-tiered-matching`: A pipeline that attempts O(1) exact matching, followed by fuzzy lexical matching, and finally semantic vector matching.
- `similarity-engine-fallback`: A graceful degradation system that uses `pgvector` in production, but can fall back to in-memory cosine similarity or pure lexical matching in local environments.
- `auto-merge-thresholds`: Configurable similarity thresholds that dictate whether an item is auto-merged, sent to manual review, or treated as net-new.

### Modified Capabilities

- `raw-data-ingestion`: The ingestion pipeline will now utilize the new similarity engine before creating records in `raw_data_assets` or `raw_data_inbox`.

## Impact

This impacts the backend data ingestion workers/API routes, the `utils/hashing.ts` logic, and how the `ApprovalInbox` is populated. It also improves the local developer experience by removing the hard dependency on `pgvector`.
