# Implementation Tasks

## Phase 1: Infrastructure & Concurrency

- [ ] Configure Cloud Run `--concurrency` strictly to match the worker pool max size.

## Phase 2: Input Validation & Limits

- [ ] Implement synchronous schema validation (HTTP 400 for invalid, HTTP 202 for valid SBRP/Legacy).
- [ ] Implement the `max_download_size` (50MB compressed) socket limit and the 250MB uncompressed limit in the fetch worker.
- [ ] Implement robust URL parsing and normalization for legacy URIs _before_ exact-match prefix validation.
- [ ] Enforce strict prototype-less dictionary lookups for `storage_route.alias` returning generic HTTP 403s on failure.

## Phase 3: Idempotency & Database

- [ ] Refactor the database idempotency UPSERT to include `table_name.tenant_id = EXCLUDED.tenant_id` and handle `affected_rows === 0`.
- [ ] Ensure surrogate `blob_id` generation for legacy payloads includes the `tenant_id`.
- [ ] Refactor the background sweeper to use `LIMIT`, `FOR UPDATE SKIP LOCKED`, and increment `retry_count` up to a `max_retries` cap.
