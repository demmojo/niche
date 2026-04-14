# Specification: SBRP Data Plane

## Structural SSRF & IDOR Elimination

- **WHEN** evaluating a legacy URI, **THEN** it must be parsed to a full URL object and normalized before exact-match path-prefix validation.
- **WHEN** validating a matched legacy URI prefix, **THEN** it must be explicitly authorized against the `authenticated_caller_tenant_id`.
- **WHEN** looking up `storage_route.alias`, **THEN** enforce strict prototype-less dictionary lookup and return a generic HTTP 403 on authorization failure or non-existent alias.

## Deterministic State Machine & Idempotency

- **WHEN** performing a database UPSERT for `blob_id`, **THEN** explicitly check `table_name.tenant_id = EXCLUDED.tenant_id` in the `DO UPDATE` clause.
- **WHEN** the UPSERT yields `affected_rows === 0`, **THEN** explicitly reject or generate a new surrogate ID.
- **WHEN** legacy payloads lack a `blob_id`, **THEN** generate a surrogate using `SHA-256(tenant_id + payload)`.
- **WHEN** retrying a payload, **THEN** only the background sweeper (using `LIMIT` and `SKIP LOCKED`) increments the `retry_count`.
- **WHEN** a payload exceeds `max_retries` or fails parsing, **THEN** transition state to `FAILED_TERMINAL`.

## Bandwidth Exhaustion & Decompression Bomb Protection

- **WHEN** fetching an incoming payload socket, **THEN** enforce a strict `max_download_size` of 50MB.
- **WHEN** decompressing the stream, **THEN** enforce a strict byte-read limit of 250MB and cap the decompression ratio.
- **WHEN** ingesting payloads, **THEN** run synchronous schema validation; invalid payloads get HTTP 400, valid ones are routed to the 202 Async queue.

## Client-Side OOM & MIME Mitigation

- **WHEN** rendering in the Observability UI, **THEN** stream parse and cap DOM output to 5MB.
- **WHEN** serving Object Storage buckets or UI proxies, **THEN** mandate `Content-Disposition: attachment`, `X-Content-Type-Options: nosniff`, and ban execution-capable MIME types like `image/svg+xml`.
