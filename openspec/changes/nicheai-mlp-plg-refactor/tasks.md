# Tasks: NicheAI MLP PLG Refactor

## Phase 1: Edge Security & Two-Phase Fetch (Phase 1)
- [ ] Configure GCP Cloud Armor / Cloudflare WAF for L7 rate-limiting on the entry point.
- [ ] Implement Tenant-scoped Firestore Distributed Counters for application-level rate limiting.
- [ ] Create Phase 1 `POST /api/roast` endpoint with `express.json({ limit: '100kb' })` enforcement.
- [ ] Update frontend to wrap Phase 1 fetch in React 19 `startTransition` and handle `202 Accepted` response.
- [ ] Enforce Firestore Security Rules restricting `generations/{jobId}` to `owner_uid`.

## Phase 2: Hybrid Streaming & Stateful Resume (Phase 2)
- [ ] Build Phase 2 SSE endpoint `GET /api/roast/{jobId}/stream` with strict IAM / Auth token validation.
- [ ] Implement the LLM integration inside the SSE handler, streaming tokens directly to `res.write()`.
- [ ] Implement periodic Firestore flush (every 3-5 seconds) of the token buffer within the SSE handler.
- [ ] Hook into `req.on('close')` to trigger an `AbortController` that cancels the LLM request and saves partial text with `status: "aborted_prematurely"`.
- [ ] Update `/cancel` endpoint with IDOR validation (`owner_uid` check) and wire it to abort the background listener.

## Phase 3: Auth Resilience & Account Upgrades
- [ ] Strip out the legacy "Auth Session Ledger" cross-device Magic Link implementation.
- [ ] Implement standard OAuth (`linkWithPopup`) for anonymous-to-registered upgrades.
- [ ] Implement `try...catch` block around `getIdToken()` with exponential backoff / 5s circuit breaker.
- [ ] Implement `linkWithCredential` fallback to handle `auth/credential-already-in-use` during upgrades.

## Phase 4: Frontend PLG UX Revamp
- [ ] Redesign `/my-reports` with dark mode, accordion master-detail layout, and polite `aria-live` explainable states.
- [ ] Rip out generic spinners and replace them with precise status indicators ("searching_exa", "analyzing").
- [ ] Add DOMPurify to the frontend streaming component to prevent Stored XSS from cached LLM markdown.
- [ ] Build the "Resume Generation" UI flow for `aborted_prematurely` reports.
- [ ] Fix superadmin `/admin/pending-roasts` queue offline UI freeze by ordering state updates before `setDoc` calls.