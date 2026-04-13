# Final SBRP OpenSpec Resolution

All vulnerabilities and contract drifts identified in the comprehensive audits have been resolved:

1.  **Correctness Fixes:**
    - Added row-level locking (`FOR UPDATE SKIP LOCKED`) and `LIMIT` to the state machine task acquisition query to prevent worker lock contention and OOM.
    - Corrected POSIX permissions for local Outbox directories to `0700` or `0750` to permit traversal.
    - Added a `retry_count` and `max_retries` cap to the `UPSERT` background sweeper logic to prevent infinite retry loops on transient poison pills.
    - Clarified that `HTTP 404` errors must be treated as transient up to a reasonable TTL to account for object storage eventual consistency.
    - Restricted the `CRLF` rejection rule to the `legacy_uri` string value rather than the raw HTTP body to avoid breaking legitimate JSON payloads.

2.  **API Contract Fixes:**
    - Removed `validation`, `pattern`, and `max_length` directives from the OTel YAML specification in `PR.md` as they violate OTel Semantic Conventions. Added textual descriptions to `conditionally_required` fields.
    - Aligned the Pre-Signed POST `content-length-range` in `execution-plan.md` to `250MB` to match the RFC's ingestion capabilities limit.
    - Replaced premature runtime abstractions (e.g., Node.js `AbortSignal.timeout`, ES6 `Map`) with generic, language-agnostic requirements ("socket timeout", "type-safe dictionaries").

3.  **Security Fixes:**
    - Added a strict tenant boundary check (`table_name.tenant_id = EXCLUDED.tenant_id`) to the `INSERT ... ON CONFLICT DO UPDATE` state machine query to prevent Cross-Tenant IDOR and payload poisoning.
    - Mandated robust URL parsing and normalization _before_ path-prefix allowlist validation for legacy URIs to close SSRF Path Traversal (`../../`) loopholes.
    - Added a strict `max_download_size` constraint on the incoming HTTP fetch socket to prevent Bandwidth Exhaustion from highly compressed payloads.
    - Explicitly banned execution-capable MIME types (`image/svg+xml`, `text/html`) from the Pre-Signed POST whitelist and mandated `Content-Disposition: attachment` for GET endpoints to prevent Stored XSS.
    - Added a requirement for local file checksum verification in the Transactional Outbox to detect data corruption at rest.
