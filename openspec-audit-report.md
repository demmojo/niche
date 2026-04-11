# Architectural Review: NicheAI MLP PLG Refactor

## 1. Architecture Overview

The system implements an asynchronous ML orchestration pipeline using Cloud Run, Cloud Tasks, and Firestore. The client initiates a job via `roastRoutes.ts` (Phase 1), which returns a `202 Accepted` response with a claim check. The job is then processed asynchronously by an internal worker route in `workerRoutes.ts` (Phase 2), utilizing the Gemini LLM and streaming results via Redis Pub/Sub back to the client.

The `tasks.md` spec outlines a crucial refactor to fix security vulnerabilities, eliminate blocking I/O, migrate rate limiting from Firestore to Redis to avoid `DEADLINE_EXCEEDED` contention, and enforce strict asynchronous scale-to-zero architectural patterns.

## 2. Change Assessment & Compliance Check

I have cross-referenced the current source code (`roastRoutes.ts`, `workerRoutes.ts`, `rateLimitCounters.ts`) against the planned Phase 0 and Phase 1-3 tasks, evaluating compliance with `ml-engineering-standards.mdc` and `frontend-growth-plg.mdc`.

The code currently **violates** numerous critical architectural mandates outlined in the updated spec. The implementation has not yet been updated to reflect the design decisions in `tasks.md`.

## 3. Detailed Risk Analysis & Violations by Severity

### CRITICAL SEVERITY (System Instability & Vulnerabilities)

1. **Floating Promise / Scale-to-Zero Violation (roastRoutes.ts)**
   - **Issue:** `tasksClient.createTask({ parent, task }).catch(...)` is executed as a floating promise. The handler immediately returns `202 Accepted`.
   - **Architectural Impact:** Cloud Run instantly throttles CPU to 0 when the HTTP request ends. Floating promises risk silent task drops, resulting in dangling pending states and phantom 202 responses.
   - **Rule Violated:** `ml-engineering-standards.mdc` (Section 1: Async ML Orchestration). "Internal worker routes invoked by Cloud Tasks MUST `await` the entire background process..." and the client-facing API MUST dispatch safely.
   - **Required Action:** Await the `createTask` call. Wrap it in a `try/catch` saga (compensating transaction) to update the job status to `failed` if dispatch throws.

2. **Firestore Rate Limit Contention (rateLimitCounters.ts / roastRoutes.ts)**
   - **Issue:** The app uses `atomicRateLimitCheck` which executes a complex multi-document transaction (`runTransaction` with shards).
   - **Architectural Impact:** High-frequency access causes massive `DEADLINE_EXCEEDED` errors and transaction aborts, breaking the API under load.
   - **Rule Violated:** `ml-engineering-standards.mdc` dictates avoiding in-app/Firestore atomic constraints for high-throughput global rate limits. The spec explicitly requires Redis `MULTI/EXEC` for mathematically accurate sub-millisecond limiting.
   - **Required Action:** Delete `rateLimitCounters.ts`. Implement Redis-based rate limiting in `roastRoutes.ts`.

3. **Insecure Auth / IDOR Vulnerability (roastRoutes.ts)**
   - **Issue:** The API extracts `owner_uid` from `req.body` (`const { idea, owner_uid } = req.body || {};`).
   - **Architectural Impact:** Anyone can submit a payload claiming to be another user, allowing malicious overwrites or unauthorized billing consumption.
   - **Rule Violated:** Standard security practices and the spec requirement: "Remove `owner_uid` from `req.body` extraction. Implement a Firebase Auth verification middleware (e.g., `requireAuth`) and rely exclusively on `req.user.uid`."
   - **Required Action:** Implement and enforce robust auth middleware. Drop `owner_uid` from the body.

4. **Missing App Check (Bot Protection) (roastRoutes.ts)**
   - **Issue:** The `/roast` entry point lacks App Check attestation.
   - **Architectural Impact:** Exposes the API to automated bot scripts that can bypass rate limits via Incognito mode (Denial of Wallet).
   - **Rule Violated:** `frontend-growth-plg.mdc` (Section 3: Server-Side PQL Gating) demands `requireAppCheck` middleware for AI routes.

5. **Missing OIDC Validation (workerRoutes.ts)**
   - **Issue:** The `/api/internal/worker/roast` endpoint has no authentication.
   - **Architectural Impact:** Server-Side Request Forgery (SSRF) and Denial of Wallet. Anyone who discovers the URL can trigger expensive LLM generation without authorization.
   - **Required Action:** Implement strict OIDC token validation middleware (`requireCloudTaskOIDC`).

### HIGH SEVERITY (Data Integrity & Concurrency Issues)

6. **Worker Lease Deadlocks (workerRoutes.ts)**
   - **Issue:** The transaction claims a lease (`leased_until`). If it fails, the catch block (`res.status(500)`) triggers a Cloud Tasks retry. However, the `leased_until` timestamp is **not** released in the `catch` block.
   - **Architectural Impact:** The retried task will hit the active lease check and be skipped (`return false`), resulting in a deadlocked job. Furthermore, the active lease check returns `200 OK` (`res.status(200).json({ status: "skipped or completed" })`), telling Cloud Tasks to _stop_ retrying.
   - **Required Action:** If a lease is active, return `429` or `503` so Cloud Tasks properly backs off. In the global `catch`, execute a Firestore update to release the `leased_until` timestamp.

7. **Blocking I/O in LLM Stream (workerRoutes.ts)**
   - **Issue:** The worker loops through the LLM stream and synchronously awaits a Firestore update (`await jobRef.update({ fullText });`) every 4 seconds.
   - **Architectural Impact:** `await`ing a remote network call inside the high-frequency stream iteration artificially stutters the real-time Redis Pub/Sub loop, degrading the client experience.
   - **Required Action:** Push the `jobRef.update` promises to an array (`flushPromises`). Await them collectively via `Promise.allSettled` before returning 200.

8. **Redis Connection Race Conditions (workerRoutes.ts)**
   - **Issue:** `workerRouter.use(async ... await redisClient.connect())` connects to Redis on a per-request middleware basis.
   - **Architectural Impact:** Highly susceptible to concurrent connection exceptions (`Socket already opened`) under load.
   - **Required Action:** Initialize the Redis connection cleanly at application startup in `server.ts`.

### MEDIUM SEVERITY (Configuration & Graceful Degradation)

9. **Hardcoded Model and Ignored Input (workerRoutes.ts)**
   - **Issue:** The worker hardcodes the Gemini model (`model: "gemini-3.1-pro"`) and completely ignores the actual user idea (`parts: [{ text: "Roast this idea" }]`).
   - **Architectural Impact:** Violates the spec and `ml-engineering-standards.mdc` (Section 1.5), which requires dynamic model resolution via Firebase Remote Config. Hardcoding the input text breaks the core product functionality.
   - **Required Action:** Fetch the `idea` from the job document. Dynamically resolve the model.

10. **Missing Input Validation & NoSQL Injection Risk (roastRoutes.ts)**
    - **Issue:** No Zod validation on `req.body.idea`.
    - **Architectural Impact:** Unvalidated input passed to Firestore and the LLM.
    - **Required Action:** Add Zod schema validation (type, length constraints).

11. **Improper Timestamp Expiration (roastRoutes.ts)**
    - **Issue:** `expiresAt` is set to `serverTimestamp()`, meaning it expires instantly.
    - **Architectural Impact:** Jobs will be immediately pruned by TTL policies or security rules.
    - **Required Action:** Compute an explicit future timestamp (e.g., `Date.now() + 24 * 60 * 60 * 1000`).

12. **Zombie Leases / Missing SIGTERM Handling (workerRoutes.ts)**
    - **Issue:** No handling for Cloud Run scale-down events (`SIGTERM`).
    - **Architectural Impact:** If the container shuts down mid-execution, the lease remains locked for 5 minutes, delaying retries.
    - **Required Action:** Bind a `process.on('SIGTERM')` listener to gracefully release active leases.

## 4. Recommendations for Implementation

The codebase is currently in a state that reflects the legacy architecture prior to the `tasks.md` spec formulation. To implement the spec safely:

1. **Phase 0 Execution:** Execute Phase 0 tasks strictly before touching the frontend or secondary features.
2. **Delete Legacy Files:** Remove `rateLimitCounters.ts` entirely.
3. **Refactor `roastRoutes.ts`:**
   - Add AppCheck and Auth middleware.
   - Swap `atomicRateLimitCheck` for Redis `MULTI/EXEC`.
   - Validate input with Zod.
   - Await `tasksClient.createTask` and add a compensating transaction.
4. **Refactor `workerRoutes.ts`:**
   - Add OIDC validation middleware.
   - Fix the transaction logic: return `429/503` on active leases, release lease on error.
   - Unblock the streaming loop by batching Firestore writes into a promise array.
   - Read the actual `idea` payload and dynamically resolve the LLM model.
5. **System Integration:** Ensure `server.ts` manages the Redis singleton lifecycle and handles `SIGTERM` signals for graceful shutdown.
