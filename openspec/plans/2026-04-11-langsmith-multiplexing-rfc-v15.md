---
status: proposed
supersedes: [2026-04-11-langsmith-multiplexing-rfc-v14]
dependencies: []
---

# RFC v15: LangSmith Multiplexing Protocol - Security & Resilience Overhaul

## 1. Executive Summary

RFC v14 suffered from four critical architectural and security flaws: Pre-Signed URL expiration cascades ("Poison Pills"), JWT Claim Check data loss, CEL Expression Injection via `tenantId` resulting in STS Downscoping Confused Deputy vulnerabilities, and Server-Side Request Forgery (SSRF) vulnerabilities via blindly trusted Cloud Tasks payloads.

RFC v15 introduces a fundamental redesign of the Multiplexing Protocol. By shifting to **Dynamic Worker-Side Security Token Service (STS)**, **Persistent Firestore State Machines**, and enforcing **Strict Input Validation/Prefix Matching**, we ensure robust, secure, and highly scalable tenant isolation.

## 2. Architectural Fixes

### 2.1 Dynamic Worker-Side STS (Resolving Poison Pills)

**Flaw in v14:** Passing Pre-Signed URLs through Cloud Tasks created "Poison Pills." If a task was delayed in the queue beyond the URL's 15-minute expiration window, the task would permanently fail upon execution, cascading into unrecoverable state errors.
**v15 Resolution:**

- The API Gateway will **no longer** generate or pass Pre-Signed URLs into the task queue.
- The queue payload will exclusively contain the `blobId` and `tenantId`.
- **Dynamic Generation:** Upon task dequeue and execution, the background worker will dynamically generate a GCP STS (Security Token Service) downscoped token _at runtime_. This guarantees the token is fresh and valid for the entirety of the worker's execution phase, entirely eliminating queue-induced expiration failures.

### 2.2 Persistent Database ID (Resolving JWT Data Loss)

**Flaw in v14:** Using 1-hour JWTs as the "Claim Check" token meant that if a client disconnected or the background job exceeded 1 hour, the client permanently lost access to the job status (Data Loss).
**v15 Resolution:**

- Discard the JWT-based Claim Check pattern.
- The API Gateway will immediately instantiate a state-machine ledger document in Firestore (`/jobs/{jobId}`) and return this persistent `jobId` to the client.
- **Client Polling:** Clients will poll this Firestore document using their standard Static API Keys. The backend API will enforce authorization by mapping the `API Key -> Tenant ID`, and verifying that the requested `jobId` strictly belongs to that `Tenant ID`.

### 2.3 Aggressive Sanitization (Resolving CEL Expression Injection)

**Flaw in v14:** Blindly interpolating the `tenantId` into GCP IAM Condition (CEL) expressions allowed malicious tenants to inject logical operators (e.g., `tenantId = 'foo" || "1"=="1'`), escalating privileges to access all cross-tenant buckets (STS Downscoping Confused Deputy).
**v15 Resolution:**

- **Strict Regex Validation:** The API Gateway MUST apply rigorous sanitization to the `tenantId` before it ever reaches the STS token generation logic or task enqueuing.
- We enforce the regex `^[a-zA-Z0-9_-]+$` on the `tenantId` field at the outermost boundary. Any payload failing this validation will be immediately rejected with a `400 Bad Request`. This ensures the CEL expression remains structurally immutable.

### 2.4 SSRF Mitigation & SDK Preference

**Flaw in v14:** Permitting the worker to blindly fetch data from a `payloadUrl` provided in the Cloud Task payload opened a critical SSRF vector.
**v15 Resolution:**

- **SDK-First:** Workers must default to using the native Cloud Storage SDK, authenticated via the downscoped STS token, to access the `blobId` directly from the known, hardcoded internal bucket.
- **Strict Prefix Matching:** If HTTP-based fetching is absolutely required for a specific internal edge case, the worker MUST enforce strict prefix matching on the URL. The URL MUST begin with exactly `https://storage.googleapis.com/` (targeting the environment's canonical bucket). Any deviation will trigger a fatal error and the task will be dropped.

## 3. Implementation Steps

1. **API Gateway Schemas:** Update Zod validation schemas to enforce `^[a-zA-Z0-9_-]+$` on `tenantId`.
2. **Firestore Ledger:** Refactor the Gateway to mint persistent Firestore `jobId` documents and return a `202 Accepted` response containing the ID.
3. **Queue Contract:** Update the Cloud Tasks enqueue payload schema to strictly accept `{ tenantId, blobId, jobId }`.
4. **Worker STS Generation:** Refactor the worker to dynamically request an STS downscoped token using the sanitized `tenantId` at execution time.
5. **Worker SDK Integration:** Update the worker to use the native `@google-cloud/storage` SDK with the STS token to pull the `blobId`, updating the Firestore `jobId` document upon success/failure.
