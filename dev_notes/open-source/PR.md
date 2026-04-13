# PR Description: Observability SDK / OpenTelemetry Integration

**Title:** feat(core): implement Sovereign Blob Reference Protocol (SBRP) for large trace ingestion
**Type:** Feature / OTel Semantic Convention Implementation

## Summary

Implements the Sovereign Blob Reference Protocol (SBRP) for Agentic AI traces.

This PR establishes an asynchronous Claim-Check pattern:

1. The Compute Plane streams payloads directly to a tenant-owned Blob Storage bucket utilizing append-only UUIDv7 keys (with tenant isolation and SHA-256 high-entropy shards, evaluated in UTC: `{hash}/{tenant_id}/YYYY/MM/DD/HH/{UUIDv7}`).
2. The orchestrator uses a Transactional Outbox (utilizing generic file storage or interfaces for serverless compatibility). The outbox explicitly drops "Poison Pill" terminal 4xx errors, delegates drop counts to standard OTel `Meter` mechanisms to prevent OOM, and implements randomized flush Exponential Backoff for transient `HTTP 429` responses.
3. The Data Plane API guarantees idempotency (via a state machine `UPSERT`) and returns **202 Accepted** for both SBRP and valid legacy payloads. Legacy full payloads are routed into a dedicated, isolated background queue to prevent App-Layer DDoS without starving the primary ingestion path. Background workers fetch payloads, verify SHA-256 checksums (using chunked streaming hashing with a penalty box circuit breaker), apply 250MB uncompressed limits (updating the DB to a terminal FAILED state for decompression bombs). Strict Concurrency Limits manages concurrency dynamically (pausing dequeues at 80% runtime memory utilization, resuming at 60% or after a fixed backoff interval to prevent starvation deadlocks) to prevent GC thrashing. Long-term idempotency relies entirely on the database constraint, eliminating redundant post-commit permanent caching and transient locks.
4. The Observability UI fetches the data directly from the bucket via a Pre-Signed URL with forced CORS and Object Storage `Content-Type` mapping to prevent Stored XSS while maintaining observability API compliance.

**Deprecation Notice & Paradigm Shift:**

- Legacy URIs are **deprecated**. For 90 days, the server will fetch them ONLY if they match a strict trusted path prefix allowlist. Unlisted legacy URIs are "blackholed" (silently dropped server-side while returning `200 OK` to the client) to prevent DDoS retry storms from older SDKs lacking circuit breakers. After 90 days, legacy payloads will be explicitly rejected with `HTTP 400` and the `DEPRECATED_FEATURE` code.
- **API Behavioral Shift:** 202 Async Ingestion means SDKs will no longer receive synchronous validation feedback for the blob contents.

## OTel YAML Specification Changes

```yaml
groups:
  - id: sbrp.blob_reference
    type: attribute_group
    attributes:
      - id: sbrp.blob_reference.legacy_uri
        type: string
        requirement_level: opt_in
        brief: "Legacy direct URI. Deprecated in favor of blob_id and storage_route.alias."
        deprecated: "Use sbrp.blob_reference.blob_id and sbrp.blob_reference.storage_route.alias instead. Removed after 90 days."
      - id: sbrp.blob_reference.blob_id
        type: string
        requirement_level:
          conditionally_required: "Required if sbrp.blob_reference.legacy_uri is absent"
        brief: "UUIDv7 identifier for the blob. Formatted as a standard 36-character string with hyphens, overriding generic OTel trace ID hex constraints."
      - id: sbrp.blob_reference.checksum
        type: string
        requirement_level: opt_in
        brief: "SHA-256 checksum of the blob payload."
      - id: sbrp.blob_reference.storage_route.alias
        type: string
        requirement_level:
          conditionally_required: "Required if sbrp.blob_reference.legacy_uri is absent"
        brief: "Authorization and routing alias mapped internally to a trusted endpoint and tenant authorization ID."
```

## Security & Reliability Posture

- **Structural SSRF Elimination:** Legacy URIs restricted to strict exact-match path-prefix allowlists that are explicitly mapped to the `authenticated_caller_tenant_id` or silently blackholed.
- **Log Forging / Response Splitting Prevention:** CRLF characters in legacy payloads trigger an immediate HTTP 400 rejection.
- **XSS Mitigation:** Pre-signed URLs mapped with safe Object Storage content types and strict UI context-aware encoding.
- **IDOR Protection:** `tenant_id` namespaces the storage path, and `storage_route.alias` authorizes access using prototype-pollution-free `Map` dictionaries. Validates the `authenticated_caller_tenant_id` exclusively. Pre-Signed POST checks `blob_id` uniqueness and prefix authorization before issuance.
- **Fail-Open Circuit Breakers & Durable Outboxes:** Standard OTel `Meter` mechanisms prevent Compute Plane OOM.
- **Asynchronous Bomb Protection:** 250MB limit sets DB to terminal FAILED. Tenant-bounded queue limits and explicit HTTP 429 `max_queue_depth` thresholds prevent memory exhaustion. Unauthorized legacy clients are blackholed via 200 OK to prevent connection starvation.
- **At-Least-Once Deduplication:** Enforced solely via `INSERT ON CONFLICT DO UPDATE` state-machine database constraints.
