# Technical Audit: Sovereign Blob Reference Protocol (SBRP)

**Classification:** Technical Architecture and Security Audit
**Target:** SBRP OpenTelemetry Semantic Conventions (OTEP) and SDK Pull Request

## 1. Executive Summary

The Sovereign Blob Reference Protocol (SBRP) has undergone rigorous adversarial security, architecture, and correctness review. This document serves as the formal validation ledger, complete with explicit references to industry standards (OWASP, IETF RFCs, MITRE CWEs).

## 2. Key Mitigations, Protocol Hardening, & Industry Sources

### 2.1 Structural SSRF Elimination and IDOR Prevention

- **Threat Vector:** Server-Side Request Forgery via HTTP Redirects, and Cross-Tenant IDOR (Confused Deputy).
- **Industry Reference:** [CWE-918: SSRF](https://cwe.mitre.org/data/definitions/918.html) / [OWASP A01:Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)
  - **The Mitigation:** Data Planes map a `storage_route.alias` against a server-side whitelist. Unrecognized aliases return explicit `HTTP 400 Bad Request` standardized JSON (with permissive, forward-compatible parsing). The lookup enforces a strict, null-safe tenant-bound authorization check (`assert(authenticated_caller_tenant_id === whitelist[storage_route.alias].owner_tenant_id)`), returning `HTTP 403 Forbidden` on failure. The HTTP client MUST enforce `follow_redirects: false`. Legacy URI SSRF prevention requires path-prefix validation rather than just exact-match domain validation to prevent SSRF via Shared Cloud Provider Domains.

### 2.2 Unauthenticated Fetch Risks

- **Threat Vector:** Data Exposure via Public Buckets.
- **The Mitigation:** The Data Plane MUST sign the backend server-to-server `GET` request using its authorized IAM roles (e.g., cloud provider signature algorithms). Unauthenticated fetches are explicitly prohibited.

### 2.3 Zip Bombs, Aggregate Memory OOM, and CPU Exhaustion

- **Threat Vector:** Uncontrolled Resource Consumption leading to Memory Exhaustion (OOM) and Node.js Event Loop Blocking.
- **Industry Reference:** [CWE-400: Uncontrolled Resource Consumption](https://cwe.mitre.org/data/definitions/400.html)
- **The Mitigation:**
  1.  **Decompression Bound:** The Data Plane MUST mandate a strict `max_download_size` on the incoming fetch socket (e.g., 50MB) for the compressed stream, aborting immediately if exceeded to prevent Bandwidth Exhaustion. It MUST also enforce a strict byte-read limit on the **uncompressed** stream during the fetch phase (e.g., 250MB), cap the maximum decompression ratio (e.g., 100:1), and enforce a strict execution timeout on the decompression stream itself to prevent CPU starvation. If exceeded during async worker fetch, the worker MUST update the database record to a terminal `FAILED_TERMINAL` state rather than attempting to return a synchronous 413 response. The synchronous `HTTP 413 Payload Too Large` MUST ONLY be used if the initial OTel span payload itself exceeds ingress limits.
  2.  **Dynamic Concurrency & Strict Concurrency Limits:** Instead of pessimistic static memory multipliers, the Data Plane MUST utilize Strict Concurrency Limits with high/low watermarks (e.g., using bounded worker pools and semaphore-based concurrency limits) to maximize throughput while preventing OOMs and GC thrashing. Queue depth MUST be strictly bounded per-tenant, synchronously rejecting spans with `HTTP 429` to prevent queue memory exhaustion.
  3.  **High-Performance Parsing & 202 Async:** Ingestion APIs immediately return `202 Accepted`. Background workers process the blob using non-blocking cryptographic hashing and streaming parsers.
  4.  **UI Pre-Signed Fetching & Stored XSS Mitigation:** Observability UIs MUST use a read-only Pre-Signed GET URL. The UI Proxy Fallback mechanism is explicitly rejected (YAGNI). Object Storage buckets MUST enforce strict CORS policies and `Content-Type` mapping to prevent execution. Furthermore, the Observability UI MUST enforce strict context-aware output encoding (e.g., modern template engines) when rendering blob contents to prevent Stored XSS.

### 2.4 Slowloris and Database Connection Starvation

- **Threat Vector:** Connection Pool Starvation via slow-drip responses and dangling DB queries.
- **Industry Reference:** [CVE-2007-6750 (Slowloris)](https://nvd.nist.gov/vuln/detail/CVE-2007-6750)
- **The Mitigation:** Prevents Head-of-Line blocking by enforcing a strict **15-30s absolute timeout**. To protect the background worker pool from hanging on connection poolers limits, workers pass a strict `AbortSignal.timeout(ms)` to the DB driver.

### 2.5 Immutable Telemetry, Outboxes, and Trace Consistency

- **Threat Vector:** State machine race conditions, Object Storage Hot Partitions, Silent Observability Loss, Head-of-Line Blocking, and Data Plane Duplication.
- **Industry Reference:** [IETF RFC 9562: UUIDv7](https://datatracker.ietf.org/doc/html/rfc9562)
- **The Mitigation:**
  1.  **Time-Bound Sharding:** The storage path MUST include the tenant namespace (validated against strict alphanumeric boundaries e.g., `^[a-zA-Z0-9_-]+$` to prevent Path Traversal), a time-bound hierarchy deterministically derived from the UUIDv7's embedded 48-bit Unix timestamp (evaluated in UTC), and a high-entropy shard prefix using SHA-256: `{SHA-256(UUIDv7)[0:4]}/{tenant_id}/YYYY/MM/DD/HH/{UUIDv7}`.
  2.  **Durable Outbox & Poison Pill Dropping:** Compute Planes buffer spans locally using a generic `OutboxStore` interface or filesystem to ensure serverless compatibility (without mandating durable local storage dependencies). To prevent head-of-line blocking, the Outbox explicitly drops terminal 4xx errors ("Poison Pills"). To prevent blindspots, an internal `dropped_spans_count` metric is emitted, strictly bounded to low-cardinality tags (no high-entropy IDs) to prevent metrics explosion. **Optimization:** Delegates drop counts to standard OTel `Meter` mechanisms to reduce network chattiness and prevent OOM.
  3.  **Distributed Deduplication & Idempotency:** Data Plane databases enforce structural idempotency via state machine UPSERTs (`INSERT ... ON CONFLICT DO UPDATE SET status = 'PENDING', checksum = EXCLUDED.checksum, storage_route_alias = EXCLUDED.storage_route_alias, updated_at = NOW(), retry_count = table_name.retry_count + 1 WHERE table_name.tenant_id = EXCLUDED.tenant_id AND (status = 'FAILED' OR (status = 'PROCESSING' AND updated_at < NOW() - INTERVAL '5 minutes'))`). The worker acquisition query MUST use row-level locking (e.g., `FOR UPDATE SKIP LOCKED`) and limits. All database queries MUST strictly utilize parameterized queries or prepared statements. Idempotency relies entirely on this database constraint. Because clients receive an immediate `202 Accepted` and discard the span, the Data Plane MUST utilize an internal background sweeper to safely retry `FAILED` payloads (like transient eventual consistency 404s) up to a `max_retries` cap and recover from worker crashes without duplicate processing, eliminating the need for transient locks.
  4.  **Blob Lifecycle Transitioning:** The Data Plane requires only `Blob Storage Read` permissions. Lifecycle management (e.g., removing the 72-hour TTL) MUST be handled entirely by the Compute Plane or the Sovereign Storage configuration.

### 2.6 MIME Spoofing & Polyglot Executables (Browser Downloads)

- **Threat Vector:** Unrestricted File Upload leading to Cross-Site Scripting (XSS) and Blob Overwrites (IDOR).
- **The Mitigation:** Pre-Signed POST generation MUST be handled by the tenant's own backend, generating UUIDv7 IDs server-side and validating path prefixes to prevent blob overwriting and IDOR. Downloads MUST be served from an origin-isolated sandbox domain, enforcing strict CORS, Object Storage `Content-Type` mappings, and Client UI output encoding to prevent execution.

### 2.7 Telemetry Desynchronization, Log Forging & SSRF

- **Threat Vector:** CRLF Injection, broken JSON parsers, and Server-Side Request Forgery via Shared Domains.
- **Industry Reference:** [CWE-117](https://cwe.mitre.org/data/definitions/117.html) / [CWE-918: SSRF](https://cwe.mitre.org/data/definitions/918.html)
- **The Mitigation:** Explicit HTTP 400 validation rejection for ASCII/Unicode control characters. The Data Plane MUST parse legacy URIs, resolve/normalize them, and validate the host and path prefix _after_ resolution using exact-match checking to prevent SSRF Path Traversal bypasses. Legacy URI string evaluations containing any CRLF characters MUST be synchronously rejected with **HTTP 400 Bad Request** to prevent HTTP Response Splitting, rather than relying on insecure CRLF stripping. Legacy URIs are supported until a coordinated API version bump (e.g., `/v2/`).
