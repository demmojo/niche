# Design: Sovereign Blob Reference Protocol (SBRP) Data Plane

## Context

Building upon Fenced Leases and Bounded Stream Parsing, we need to address adversarial distributed systems edge cases like state machine DoS, cross-tenant squatting, and bandwidth exhaustion.

## Goals / Non-Goals

- **Goals:** Eliminate structural SSRF and IDOR, ensure idempotency, prevent bandwidth exhaustion via decompression bombs, and mitigate client-side OOM crashes.
- **Non-Goals:** Expanding legacy payload structures without synchronous schema validation.

## Decisions

1. **Robust URL Parsing:** Legacy URIs must be parsed, resolved, and normalized before prefix validation.
2. **Tenant-Bound Allowlists & Aliases:** Legacy URIs and `storage_route.alias` lookups strictly bound to `authenticated_caller_tenant_id` using type-safe, prototype-less dictionaries. Returns generic 403 on alias failures.
3. **Cross-Tenant UPSERT Protection:** The `DO UPDATE` clause must explicitly check `table_name.tenant_id = EXCLUDED.tenant_id` and handle `affected_rows === 0` (reject or generate new surrogate ID).
4. **Deterministic Surrogate IDs:** Generated `blob_id` for legacy payloads includes the `tenant_id` (e.g., `SHA-256(tenant_id + payload)`).
5. **Sweeper-Only Increments:** Only background sweepers (`SKIP LOCKED`) increment the `retry_count`.
6. **Resource Limits:** 50MB incoming HTTP socket limit, 250MB uncompressed limit.

## Risks and Trade-offs

Strict 250MB limitations on uncompressed JSON may block exceptionally large LLM trace workflows, requiring chunking.

## Future Potential

Enhancing background sweeper heuristics for dynamic throttling based on infrastructure load.
