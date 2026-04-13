# Execution Plan: Sovereign Blob Reference Protocol (SBRP)

## Objective

To execute the integration of the Sovereign Blob Reference Protocol (SBRP) into OpenTelemetry (OTel) and Observability SDKs, maximizing acceptance likelihood through staged rollouts while safely handling transient rollout states.

## Milestones & Tasks

### 0. Socialization & Consensus Building

**Status:** Not Started

- [ ] **Observability Discussion:** Open a GitHub Discussion/Issue titled _"RFC: Enterprise Data Sovereignty & 100MB+ Context Tracing (Claim-Check Pattern)"_.
- [ ] **OTel Socialization:** Join the OTel Semantic Conventions Slack/SIG (GenAI/Messaging) to propose SBRP.

### 1. Pre-requisite Architecture, Edge Protection, & Security Hardening

**Status:** Not Started

- [ ] **Whitelist Prototype Pollution Fix:** Refactor storage route whitelist dictionaries to use `Object.create(null)` or ES6 `Map`.
- [ ] **Tenant Blob Storage Edge Protection:** Configure Pre-Signed POST policies (`content-length-range` e.g. 250MB). MUST be deployed before SDKs start emitting. Validates path prefix authorization before issuance and mandates server-side UUIDv7 generation for collision avoidance.
- [ ] **Contract Validation Test Suite:** Implement integration tests to verify JSON schema responses (`VALIDATION_ERROR`, `FORBIDDEN`, `PAYLOAD_TOO_LARGE`, `TOO_MANY_REQUESTS`, `DEPRECATED_FEATURE`). Ensure unlisted legacy URIs are blackholed (return 200 OK but drop server-side). Synchronously reject CRLF payloads with 400 Bad Request. Validate exact-match path-prefix matching for SSRF allowlist.
- [ ] **Blob Path Determinism & Tenant Isolation:** Update Blob Storage path generation to mandate `{SHA-256(UUIDv7)[0:4]}/{tenant_id}/YYYY/MM/DD/HH/{UUIDv7}`, utilizing UUIDv7 timestamps evaluated in UTC.
- [ ] **Structural Idempotency:** Rely exclusively on an UPSERT (`INSERT ON CONFLICT ... DO UPDATE`) state machine for idempotency. This prevents thundering herds while safely handling retries of `FAILED` payloads, without the overhead of distributed locks.

### 2. OTel Semantic Convention Proposal (OTEP)

**Status:** Not Started

- [ ] **Create the OTEP Fork:** Fork the `open-telemetry/oteps` repository.
- [ ] **Draft `text/0XXX-sbrp-telemetry.md`:** Introduce `storage_route.alias`, `blob_id`, and `checksum` fields. Deprecate legacy URIs. Propose as an _Experimental_ (Opt-In) attribute group.

### 3. Staged PR 1: Observability Backend (Non-Breaking Infrastructure)

**Status:** Not Started

- [ ] **Implement 202 Async Ingestion for SBRP:** Refactor ingestion endpoints to return `HTTP 202 Accepted` strictly for new `storage_route.alias` payloads. Route legacy payloads into a dedicated, isolated background queue to prevent Application-Layer DDoS without starving the primary ingestion path.
- [ ] **Implement Endpoint Constructor & Authz:** Map `storage_route.alias` to trusted endpoints via strict tenant-bound authorization using `authenticated_caller_tenant_id`.
- [ ] **Queue-level Tenant Rate Limiting & Capacity:** Implement Tenant-Bounded rate limiting and strict `max_queue_depth`. Reject valid SBRP and legacy spans with **HTTP 429** when capacity is exceeded. Blackhole (200 OK) is reserved strictly for unauthorized/unlisted legacy URIs to prevent DDoS retry storms.
- [ ] **Implement Fetch Client Safeguards:**
  - Verify `sbrp.blob_reference.checksum` during streaming using chunked streaming cryptographic hashing. Implement a Penalty Box / circuit breaker for tenants failing checksum validations.
  - Enforce cloud provider signature algorithms, 250MB uncompressed limits, and 15-30s timeouts. If exceeded, update the database record to a terminal FAILED state, log the failure, and emit a metric.
  - Implement Strict Concurrency Limits to prevent GC thrashing.

### 4. Staged PR 2: Observability Backend (UI Security)

**Status:** Not Started

- [ ] **Pre-Signed UI Fetching & XSS Mitigation:** Generate Pre-Signed GET URLs checking for an explicit `VALIDATED` blob state to prevent TOCTOU races during async ingestion. Serve from an origin-isolated sandbox domain using strict CORS and `Content-Type` mappings to prevent Stored XSS.

### 5. Staged PR 3: Observability SDKs & Emitters (Compute Plane)

**Status:** Not Started

- [ ] **Audit & Update Emitters:** Fork `langchain-ai/langsmith-sdk`. Wrap changes behind a feature flag (e.g., `LANGSMITH_EXPERIMENTAL_SBRP=true`).
- [ ] **Implement Transactional Outbox:** Buffer spans locally using a generic `OutboxStore` interface or filesystem to ensure serverless compatibility.
- [ ] **Implement "Poison Pill" Dropping & Safe Metrics:** Branch logic on exact JSON errors (`VALIDATION_ERROR`, `FORBIDDEN`, `PAYLOAD_TOO_LARGE`, `DEPRECATED_FEATURE`). Ensure Outbox gracefully drops payloads and avoids infinite retries if the proxy returns a terminal non-JSON HTML error (e.g. HTTP 413, HTTP 403), while explicitly exempting HTTP 429 and HTTP 408 HTML responses to ensure exponential backoff continues. Delegate `sbrp.outbox.dropped_spans_count` to standard OTel `Meter` mechanisms.
- [ ] **Implement Fail-Open Circuit Breakers:** Treat `HTTP 429` as transient and retry with exponential backoff.
