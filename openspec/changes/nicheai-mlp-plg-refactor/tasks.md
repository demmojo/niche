# Tasks: NicheAI MLP PLG Refactor

## Phase 1: Edge Security & Two-Phase Fetch (Phase 1)

- [ ] Configure GCP Cloud Armor / Cloudflare WAF for volumetric IP L7 rate-limiting on the entry point.
- [ ] Implement Time-Bucketed Firestore Transactions for business rate limiting, relying on Firebase Anonymous UIDs AND Application-level Hashed IPs to prevent UID resets.
- [ ] Implement middleware to catch Firestore contention (`DEADLINE_EXCEEDED` / `ABORTED`) and return 429/503 polite toast, while logical exhaustion returns 402/QUOTA_EXCEEDED for Auth Modals.
- [ ] Create Phase 1 `POST /api/roast` endpoint with `express.json({ limit: '100kb' })` enforcement.
- [ ] Update endpoint to strictly await `db.collection('jobs').doc(jobId).set(...)` with an `expiresAt` native Timestamp. Catch any fire-and-forget Firestore timeout failures to prevent gRPC connection leaks.
- [ ] Implement Cloud Tasks `createTask()` dispatch pointing to the new internal worker endpoint (`/api/internal/worker/roast`).
- [ ] Update frontend to wrap Phase 1 fetch in React 19 `startTransition` and handle `202 Accepted` response.
- [ ] Standardize the frontend and backend to use the `jobs` collection exclusively (rip out `pending_reports`).
- [ ] Enforce Firestore Security Rules restricting `jobs/{jobId}` and `generations/{jobId}` to `owner_uid` and `request.time < resource.data.expiresAt`.

## Phase 2: True Decoupled Execution (Worker & Observation)

- [ ] Build internal Cloud Tasks worker endpoint (`POST /api/internal/worker/roast`) and implement strict OIDC token validation.
- [ ] Implement idempotent job claiming in the worker using `runTransaction` (setting a `leased_until` timestamp) before invoking the LLM, to prevent deadlocks on Cloud Task retries if a container OOMs.
- [ ] Implement the LLM integration inside the worker. Stream sub-second chunks to Redis Pub/Sub, while periodically flushing the `fullText` buffer to the Firestore `jobs` document every 3-5 seconds.
- [ ] If multi-turn prompts are required, implement Gemini Chat History prefilling (`role: model`) to safely pass prior context without massive string concatenations.
- [ ] Build Phase 2 SSE observation endpoint (`GET /api/roast/{jobId}/stream`). It must subscribe to the Redis channel for instant deltas, and fall back to Firestore `fullText` for the initial cursor.
- [ ] Implement test-only Express middleware to ignore `close` attachment in Supertest environments.
- [ ] Hook `req.on('close')` in the SSE endpoint strictly to call `unsubscribe()` and clean up Redis/Firestore listeners (DO NOT abort the background worker LLM).
- [ ] Update `/cancel` endpoint with IDOR validation (`owner_uid` check) and wire it to explicitly set `status: 'cancelled'` in Firestore, which the worker must periodically check to abort operations.

## Phase 3: Auth Resilience & Account Upgrades

- [ ] Strip out the legacy "Auth Session Ledger" cross-device Magic Link implementation.
- [ ] Implement standard OAuth (`linkWithPopup`) for anonymous-to-registered upgrades.
- [ ] Implement `try...catch` block around `getIdToken()` with exponential backoff / 5s circuit breaker.
- [ ] Implement `linkWithCredential` fallback to handle `auth/credential-already-in-use` during upgrades.
- [ ] Implement a backend Cloud Function hook or API method to reassign `owner_uid` on all of a user's previous `jobs` when converting from Anonymous to a permanent OAuth UID, preventing orphaned reports.

## Phase 4: Frontend PLG UX Revamp

- [ ] Redesign `/my-reports` with dark mode, accordion master-detail layout, and polite `aria-live` explainable states.
- [ ] Rip out generic spinners and replace them with precise status indicators ("searching_exa", "analyzing").
- [ ] Add DOMPurify to the frontend streaming component, ensuring the `sanitize` call is debounced to prevent $O(N^2)$ Main Thread freezes during large LLM generations.
- [ ] Display a countdown banner based on `expiresAt` for anonymous users to create urgency to save the report permanently.
- [ ] Build the "Resume Generation & Email Me" UI conversion flow for long waits, which sets `async_delivery: true`.
- [ ] Fix superadmin `/admin/pending-roasts` queue offline UI freeze by ordering state updates before `setDoc` calls.
