# Final SBRP OpenSpec Resolution

All vulnerabilities and contract drifts identified in the comprehensive audits have been resolved:

1.  **Correctness Fixes:**
    - Corrected the `HTTP 413 Payload Too Large` vs `Legacy Full Payload` contradiction. Standard proxy ingress limits apply to ALL synchronous payloads; only valid legacy payloads within limits go to the background queue.
    - Repaired the `max_retries` race condition. The client ingestion `UPSERT` no longer increments `retry_count`. Only the paginated background sweeper increments it during recovery.
    - Updated the Pre-Signed POST authorization definition from "strictly prefixes" to "strictly conforms to the namespace format" to account for the preceding SHA-256 shard in the blob path.
    - Legacy payloads lacking a `blob_id` will now have a deterministic surrogate `blob_id` generated server-side to remain compatible with the `INSERT ON CONFLICT` state machine.

2.  **API Contract Fixes:**
    - Added synchronous schema validation for all incoming payloads. Even under `202 Async Ingestion`, invalid payloads (including legacy) are synchronously rejected with `HTTP 400 Bad Request`.
    - Clarified that `blob_id` MUST be a standard 36-character string with hyphens, overriding generic OTel trace ID hex requirements.
    - Defined missing error schemas for `DEPRECATED_FEATURE` and generic `FORBIDDEN` edge cases.
    - Clarified that attributes like `sbrp.blob_reference.storage_route.alias` MUST be serialized as flat strings, not nested JSON objects.
    - Stripped remaining vendor-specific terms (e.g., "LangSmith SDK", "simdjson", "Go", "Rust") from all files.

3.  **Security Fixes:**
    - Enforced tenant authorization checks against matched legacy URIs in the allowlist to prevent Cross-Tenant IDOR via global allowlists.
    - Updated Penalty Box logic to restrict tenants who trigger *any* deterministic failure (including JSON parsing errors on non-JSON garbage payloads), preventing attackers from bypassing backpressure by omitting the optional checksum.
    - Mandated a `LIMIT` clause on the background sweeper to prevent Database Lock Starvation / DoS.
    - Mandated that Observability UIs implement client-side rendering truncations (e.g., 5MB DOM cap) and streaming to prevent Client-Side Browser DoS via OOM on 250MB payloads.
    - Resolved the Alias Enumeration vulnerability by returning a generic `HTTP 403` regardless of whether the alias exists or fails authorization.
    - Resolved the Log Forging vulnerability by requiring downstream systems to serialize using JSON or explicitly escape CRLF characters before writing to plaintext sinks.
