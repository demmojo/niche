---
dependencies: []
---

# RFC v27: Sovereign Blob Reference Protocol (SBRP) Data Plane

**Status:** Proposed  
**Author:** NicheAI Architecture Team  
**Reviewers:** Engineering, Infrastructure, Security, Data Integrity  
**Obsoletes:** RFC v26

## 1. Executive Summary

RFC v26 implemented Fenced Leases and Bounded Stream Parsing, but recent adversarial reviews highlighted critical distributed systems edge cases: Cross-Tenant IDOR squatting, Infinite Poison-Pill retry loops via background sweepers, SSRF Path Traversal bypasses on legacy URIs, Bandwidth Exhaustion from compressed zip bombs, and OTel spec contract drifts.

RFC v27 ("Sovereign Blob Reference Protocol Data Plane") is the final evolution. It achieves mathematical certainty by decoupling compute from state management, shifting all garbage collection to infrastructure, isolating workloads via Bounded Node.js Worker Pools (with matched Cloud Run concurrency), enforcing strict tenant authorization boundaries on state machine UPSERTs, neutralizing SSRF via robust URL parsing, and aligning with standard OTel semantic conventions.

## 2. Final Hardening Measures

### 2.1. Structural SSRF & IDOR Elimination

**The Problem:** Global allowlists for legacy URIs permit Cross-Tenant Data Injection if an attacker provides a victim's payload URI. Relying on raw string `.startsWith()` matching permits `../../` Path Traversal bypasses.
**The Fix:**

- **Robust URL Parsing:** Legacy URIs MUST be parsed into a full URL object and resolved/normalized _before_ exact-match path-prefix validation occurs.
- **Tenant-Bound Allowlists:** The matched legacy URI path prefix MUST be explicitly authorized against the `authenticated_caller_tenant_id` to prevent Cross-Tenant Data Injection.
- **Alias Authorization:** `storage_route.alias` lookups MUST enforce a strict, type-safe tenant-bound authorization check (`typeof id === 'string'`) using prototype-less dictionaries. To prevent Alias Enumeration, the API MUST return a generic HTTP 403 regardless of whether the alias exists or fails authorization.

### 2.2. Deterministic State Machine & Idempotency

**The Problem:** Background sweepers infinitely retrying transient failures create Database DoS. Client retries can artificially reset and exhaust the retry budget. `INSERT ON CONFLICT (blob_id)` allows an attacker to squat on a victim's `blob_id`, silently dropping the victim's payload because the `tenant_id` WHERE clause fails.
**The Fix:**

- **Cross-Tenant UPSERT Protection:** The `DO UPDATE` clause explicitly checks `table_name.tenant_id = EXCLUDED.tenant_id`. The backend MUST verify `affected_rows > 0` after the UPSERT; if 0, it must explicitly reject or generate a new surrogate ID to prevent silent IDOR squatting.
- **Surrogate ID Collision Prevention:** For legacy payloads lacking a `blob_id`, the deterministic surrogate `blob_id` MUST include the `tenant_id` (e.g., `SHA-256(tenant_id + payload)`).
- **Sweeper-Only Retry Increments:** The `retry_count` is ONLY incremented by the paginated background sweeper (which runs with a `LIMIT` clause and `SKIP LOCKED`), preventing aggressive client retries from burning the budget.
- **Terminal Transitions:** Payloads exceeding a hard `max_retries` cap or encountering deterministic failures (parsing errors) MUST be marked as `FAILED_TERMINAL`.

### 2.3. Bandwidth Exhaustion & Decompression Bomb Protection

**The Problem:** Malicious users uploading highly compressed 10GB payloads can exhaust incoming network bandwidth before hitting the 250MB uncompressed limit.
**The Fix:**

- **Compressed Socket Limits:** The Data Plane MUST mandate a strict `max_download_size` on the incoming HTTP fetch socket (e.g., 50MB).
- **Uncompressed Limits:** The Data Plane MUST enforce a strict byte-read limit on the uncompressed stream (e.g., 250MB) and cap the decompression ratio.
- **Synchronous Schema Validation:** All payloads (including legacy) undergo synchronous schema validation. Invalid payloads are synchronously rejected with HTTP 400. Only valid payloads within proxy ingress limits are routed to the 202 Async background queue.

### 2.4. Client-Side OOM & MIME Spoofing Mitigation

**The Problem:** Rendering a 250MB JSON payload in the Observability UI will crash the browser DOM. SVG uploads can execute stored XSS.
**The Fix:**

- **DOM Truncation:** Observability UIs MUST implement stream parsing and strict client-side rendering truncations (e.g., capping DOM output to 5MB).
- **Safe Headers:** Object Storage buckets and UI fetch proxies MUST explicitly ban execution-capable MIME types (`image/svg+xml`), and mandate `Content-Disposition: attachment` and `X-Content-Type-Options: nosniff`.

## 3. Tasks for Implementation

- [ ] Configure Cloud Run `--concurrency` strictly to match the worker pool max size.
- [ ] Implement synchronous schema validation (HTTP 400 for invalid, HTTP 202 for valid SBRP/Legacy).
- [ ] Refactor the database idempotency UPSERT to include `table_name.tenant_id = EXCLUDED.tenant_id` and handle `affected_rows === 0`.
- [ ] Implement the `max_download_size` (50MB compressed) socket limit and the 250MB uncompressed limit in the fetch worker.
- [ ] Implement robust URL parsing and normalization for legacy URIs _before_ exact-match prefix validation.
- [ ] Refactor the background sweeper to use `LIMIT`, `FOR UPDATE SKIP LOCKED`, and increment `retry_count` up to a `max_retries` cap.
- [ ] Enforce strict prototype-less dictionary lookups for `storage_route.alias` returning generic HTTP 403s on failure.
- [ ] Ensure surrogate `blob_id` generation for legacy payloads includes the `tenant_id`.

## 4. Conclusion

RFC v27 eliminates all vulnerabilities in asynchronous processing and data sovereignty. By hardening the state machine against cross-tenant IDORs, neutralizing SSRF path traversals, preventing bandwidth exhaustion, and aligning strictly with OTel semantic constraints, the protocol guarantees secure, exactly-once execution for massive LLM traces.
