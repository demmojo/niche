# Tasks: NicheAI MLP PLG Refactor

## Phase 00: Remediation of Errant Implementation (Strict Enforcement)

The recent commit (`feat(api): implement decoupled architecture and resolve failing tests`) introduced several critical regressions that directly violate the OpenSpec architecture. Before any new features are implemented, the following MUST be fixed to restore system integrity:

- [ ] **Revert Defeated Sharding (`rateLimitCounters.ts`):** The recent update to `atomicRateLimitCheck` introduced a global lock by reading all shards in a single transaction, guaranteeing `DEADLINE_EXCEEDED` crashes. You MUST completely remove this transaction or migrate fully to the Redis `MULTI/EXEC` pipeline as originally specified in Phase 1.
- [ ] **Restore OIDC Security Boundary (`workerRoutes.ts`):** The `requireInternalOidc` middleware was incorrectly deleted from `workerRoutes.ts`. You MUST restore it immediately to prevent unauthenticated SSRF/DoW attacks on the background worker.
- [ ] **Fix Floating Promises & Scale-to-Zero (`roastRoutes.ts`):** The `tasksClient.createTask` call in `roastRoutes.ts` was implemented as a fire-and-forget floating promise. You MUST strictly `await` it before returning `202 Accepted` to prevent silent task drops.
- [ ] **Fix API Contract Breakage (402 vs 429 in `roastRoutes.ts`):** The API now returns `402 Payment Required` for anonymous rate limits, breaking existing clients expecting `429`. Either revert to `429` with a distinct `error` string payload, or explicitly update frontend clients to parse `402`.
- [ ] **Restore Missing Worker Routes (`workerRoutes.ts`):** The routes `/run-validation-campaign`, `/network-io`, `/vision-ml`, and `/flywheel-cache-jit` were deleted. Unless explicitly deprecated in the spec, these MUST be restored to prevent 404s for in-flight legacy tasks.
- [ ] **Fix Anti-Pattern Retry Signaling (`workerRoutes.ts`):** The worker currently returns `200 OK` on locked leases. It MUST return `429` or `503` to trigger Cloud Tasks backoff and retry correctly.
- [ ] **Fix Redis Race Condition (`workerRoutes.ts`):** Remove `await redisClient.connect()` from per-request middleware to prevent "Socket already opened" crashes on cold starts.
- [ ] **Fix Unvalidated Payload Injection (`roastRoutes.ts`):** Enforce strict Zod string validation on `req.body.idea` to prevent NoSQL injection via complex objects.
- [ ] **Fix Blocking I/O in LLM Stream (`workerRoutes.ts`):** Detach the `await jobRef.update({ fullText })` promise inside the LLM chunk stream to prevent synchronous I/O from artificially throttling the token generation speed.

## Phase 0: Pre-Flight Remediation (Critical Architecture & Security Hotfixes)

Before proceeding with the broader refactor, the following critical regressions and vulnerabilities in the current source code MUST be fixed immediately to stabilize the pipeline:

- [ ] **Fix App Check Bot Protection in `roastRoutes.ts`:** Add `requireAppCheck` middleware to the `/roast` entry point to prevent Denial of Wallet (DoW) from automated bots generating endless anonymous sessions.
- [ ] **Fix IDOR & Auth Bypass in `roastRoutes.ts`:** Remove `owner_uid` from `req.body` extraction. Implement a Firebase Auth verification middleware (e.g., `requireAuth`) and rely exclusively on `req.user.uid`.
- [ ] **Fix SSRF in `workerRoutes.ts`:** Add strict OIDC token validation middleware (e.g., `requireCloudTaskOIDC`) to the `/api/internal/worker/roast` endpoint to prevent unauthenticated External execution and Denial of Wallet (DoW).
- [ ] **Fix Silent Task Drops (Scale-to-Zero) in `roastRoutes.ts`:** Change the floating promise `tasksClient.createTask({ parent, task }).catch(...)` to be strictly `await`ed before returning the `202 Accepted` response.
- [ ] **Implement Compensating Transaction (Saga):** Wrap `tasksClient.createTask` in a `try/catch`. If dispatch fails, execute a compensating update (`status: 'failed'`) before returning `500` to prevent dangling "pending" UI states.
- [ ] **Fix Worker Fallback URL:** Remove the broken fallback interpolation `https://${project}.run.app/api/...` in `roastRoutes.ts`. Enforce `WORKER_URL` as a strictly validated, required environment variable.
- [ ] **Fix Lease Deadlocks & Retry Failures in `workerRoutes.ts`:** Update the transaction handler so that active leases return a `429` or `503` (NOT `200`) to explicitly trigger Cloud Tasks backoff. In the global `catch (error)` block, execute a Firestore update to release the `leased_until` timestamp so retries are unblocked.
- [ ] **Handle SIGTERM for Leases:** Bind a `process.on('SIGTERM')` listener that intercepts Cloud Run scale-down signals and releases all active `leased_until` timestamps immediately to prevent zombie leases.
- [ ] **Fix LLM Input & Model Hardcoding:** Stop ignoring user input. Extract the `idea` payload from the job document data. Replace the hardcoded `"gemini-3.1-pro"` model string with dynamic resolution via Firebase Remote Config.
- [ ] **Fix Firestore Contention & Legacy Code:** Completely delete `src/server/utils/rateLimitCounters.ts`. It causes massive `DEADLINE_EXCEEDED` errors. Implement the Redis `MULTI/EXEC` rate-limiter in `roastRoutes.ts`.
- [ ] **Fix Redis Connection Race Conditions:** Remove `redisClient.connect()` from the per-request middleware in `workerRoutes.ts`. Initialize the Redis connection cleanly at application startup (`server.ts`).
- [ ] **Fix Blocking I/O in LLM Stream:** Remove the synchronous `await jobRef.update({ fullText })` inside the LLM streaming loop. Push these to a `flushPromises` array and `await Promise.allSettled(flushPromises)` before returning `200 OK`.
- [ ] **Fix Missing Input Validation & TTL:** Add Zod schema validation to `req.body.idea` in `roastRoutes.ts` to prevent NoSQL injection. Update `expiresAt` to use `Date.now() + 24 * 60 * 60 * 1000` instead of instant `serverTimestamp()`. Update `202` message to `"initializing_roast"`.
- [ ] **Halt Background Worker on SSE Disconnect:** Ensure the SSE endpoint's `req.on('close')` event proactively publishes a Redis cancellation event to abort the LLM generation and save API credits if the user abandons the tab.

## Phase 1: Edge Security & Two-Phase Fetch (Phase 1)

- [ ] Configure GCP Cloud Armor / Cloudflare WAF for volumetric IP L7 rate-limiting on the entry point.
- [ ] Replace Firestore-based rate limiting with an atomic Redis `MULTI/EXEC` pipeline (or Lua script) executing `INCR` and `EXPIRE` commands for high-performance quota enforcement. This resolves the critical Firestore transaction contention bug and provides mathematically accurate, sub-millisecond rate limits without `DEADLINE_EXCEEDED` crashes or orphaned keys without TTLs. Remove dead code (`incrementRateLimitCounter`, `checkRateLimit`, `atomicRateLimitCheck`).
- [ ] Implement middleware to catch Firestore contention (`DEADLINE_EXCEEDED` / `ABORTED`) and return 429/503 polite toast, while logical exhaustion returns `402 Payment Required` for Auth Modals to prevent client retry loops. Also, implement `BYPASS_ANONYMOUS_LIMITS` environment variable for local testing.
- [ ] Secure Phase 1 `POST /api/roast` endpoint: Enforce `express.json({ limit: '100kb' })`. Use `zod` to strictly validate `req.body.idea` (string, length constraints) to prevent NoSQL injection, and ensure Zod validation errors are intercepted and formatted to match the global API `{ error: string }` response schema. **CRITICAL:** Do not extract `owner_uid` from the request body (IDOR risk); rely exclusively on `req.user.uid` from verified Auth middleware.
- [ ] Update endpoint to strictly await `db.collection('jobs').doc(jobId).set(...)` with an `expiresAt` native Timestamp. Catch any fire-and-forget Firestore timeout failures to prevent gRPC connection leaks.
- [ ] Implement deterministic Cloud Tasks dispatch (`tasks/{jobId}`) pointing to the new internal worker endpoint (`/api/internal/worker/roast`). **CRITICAL:** This `createTask()` call MUST be `await`ed. Floating promises risk silent task drops when Cloud Run scales to zero after the 202 response.
- [ ] Update frontend to wrap Phase 1 fetch in React 19 `startTransition` and handle `202 Accepted` response, ensuring `402` triggers the upgrade modal.
- [ ] Standardize the frontend and backend to use the `jobs` collection exclusively (rip out `pending_reports`).
- [ ] Enforce Firestore Security Rules restricting `jobs/{jobId}` to `owner_uid` and `request.time < resource.data.expiresAt`.

## Phase 2: True Decoupled Execution (Worker & Observation)

- [ ] Build internal Cloud Tasks worker endpoint (`POST /api/internal/worker/roast`) and implement strict OIDC token validation to prevent SSRF/unauthenticated LLM execution.
- [ ] Implement robust job claiming: Use a strict Firestore `runTransaction` (or Redis `SETNX`) to atomically claim the job. If a job is currently leased by another worker (`leased_until` valid), return `429` or `503` (NOT `200`) so Cloud Tasks explicitly backs off and retries. If the worker encounters a fatal error, it MUST release the `leased_until` timestamp in the `catch` block to prevent blocking retries.
- [ ] Implement the Redis Singleton Multiplexed Subscriber pattern. Move the initial `redisClient.connect()` to the application startup (`server.ts`) or use a singleton promise to avoid fatal concurrent connection race conditions.
- [ ] Implement the LLM integration inside the worker. Extract the actual `idea` payload from the job document (do not hardcode). Stream sub-second chunks to Redis Pub/Sub. Ensure the 3-5 second `fullText` Firestore flush is non-blocking (e.g., pushing promises to an array and using `.catch()`) so `await` doesn't artificially stutter the real-time Redis loop. **CRITICAL:** Ensure `await Promise.allSettled(flushPromises)` is called before the worker exits to prevent data loss.
- [ ] If multi-turn prompts are required, implement Gemini Chat History prefilling (`role: model`) to safely pass prior context without massive string concatenations.
- [ ] Build Phase 2 SSE observation endpoint (`GET /api/roast/{jobId}/stream`). It must attach an `EventEmitter` listener to the Redis Multiplexer for instant deltas. **CRITICAL:** Try reading the accumulated `fullText` cursor directly from Redis (`GET`) before hitting Firestore `fullText` as a last-resort fallback. Include `res.setHeader("X-Accel-Buffering", "no")`.
- [ ] Implement test-only Express middleware to ignore `close` attachment in Supertest environments.
- [ ] Hook `req.on('close')` in the SSE endpoint strictly to remove the `EventEmitter` listener and clean up Firestore listeners. (Note: For the background worker endpoint, ensure the LLM generator relies on a worker-scoped `AbortController` in case of worker preemption, rather than the SSE client's connection).
- [ ] Update `/cancel` endpoint with IDOR validation (`owner_uid` check) and wire it to explicitly set `status: 'cancelled'` in Firestore, and publish a cancellation event to Redis. The worker must listen to this event via the multiplexer to safely abort operations mid-stream.

## Phase 3: Auth Resilience & Account Upgrades

- [ ] Strip out the legacy "Auth Session Ledger" cross-device Magic Link implementation.
- [ ] Implement standard OAuth (`linkWithPopup`) for anonymous-to-registered upgrades, and wrap the frontend caller in an `AbortController` to prevent React state updates on unmount.
- [ ] Implement `try...catch` block around `getIdToken()` with exponential backoff / 5s circuit breaker, bound to an `AbortSignal` to prevent unmounted component leaks.
- [ ] Implement `signInWithCredential` fallback to handle `auth/credential-already-in-use` during upgrades by extracting the credential from the error, and follow up with `auth.currentUser?.reload()` to hydrate the React state.
- [ ] Remove any backend logic that attempts bulk `owner_uid` reassignment for anonymous upgrades. Accept orphaned jobs as a PLG trade-off to prevent IDOR risks.

## Phase 4: Frontend PLG UX Revamp

- [ ] Redesign `/my-reports` with dark mode, accordion master-detail layout, and polite `aria-live` explainable states.
- [ ] Rip out generic spinners and replace them with precise status indicators ("searching_exa", "analyzing").
- [ ] Add DOMPurify to the frontend streaming component, and wrap the sanitized content rendering in React 19 `useDeferredValue` to prevent $O(N^2)$ Main Thread freezes during large LLM generations.
- [ ] Ensure the frontend SSE `useEffect` parser safely calls `setError` and returns on chunk parsing failures, strictly avoiding `throw new Error()` which silently hangs the UI.
- [ ] Display a countdown banner based on `expiresAt` for anonymous users to create urgency to save the report permanently.
- [ ] Implement in-UI graceful degradation for timeout and error states for Two-Phase Fetch, rather than relying on email fallbacks.
- [ ] Fix superadmin `/admin/pending-roasts` queue offline UI freeze by ordering state updates before `setDoc` calls.

## Phase 5: Test Suite Modernization & Residual Risk Mitigation

- [ ] Update `atomicRateLimitCheck` test logic to instead verify the new Redis-based rate limiting mechanism, mocking `redisClient.incr` and `redisClient.expire` to simulate 429 and 402 outcomes.
- [ ] Wrap `redisClient.publish` calls inside the worker LLM stream in a localized `try/catch` to prevent transient Redis connection drops from crashing the entire generative pipeline.
- [ ] Rewrite the "202 Claim-Check & Floating Promises" test in `roastRoutes.test.ts` to assert synchronous dispatch of `tasksClient.createTask`, explicitly rejecting the floating promise architectural anti-pattern.
- [ ] Completely overhaul `workerRoutes.test.ts` to cover the actual `POST /roast` worker endpoint. Remove assertions for non-existent routes (`/network-io`, `/vision-ml`, etc.). Add specific assertions verifying `429/409` responses on locked leases (not `200 OK`).
- [ ] Dynamically resolve the LLM model name (e.g., `gemini-3.1-pro`) via Firebase Remote Config in the worker rather than hardcoding it, ensuring compliance with ML architecture rules.
- [ ] Update the Phase 1 endpoint's `202 Accepted` response message to a context-accurate string (e.g., "initializing_roast") instead of the legacy "searching_exa" string.
- [ ] Fix `roastRoutes.test.ts` to properly enforce and assert +24h TTL logic for the `expiresAt` native Timestamp, removing simple string mocks.
- [ ] Implement graceful container shutdown in `server.ts` to handle `SIGTERM` signals. Drain the Redis connection safely and allow any in-flight background worker streams or SSE responses to finish or cleanly abort to prevent data corruption during Cloud Run scale-down events. Additionally, configure or verify the Redis instance's eviction policy (e.g., `volatile-lru`) to ensure rate limit keys and pub/sub streams do not exhaust memory.
