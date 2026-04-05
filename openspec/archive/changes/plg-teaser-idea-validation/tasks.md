# Tasks: PLG Teaser for Idea Validation

## Phase 1: Backend SSE and AI Logic

- [x] Update `/api/scoring/stream` in `src/server/scoringRoutes.ts` to detect anonymous users.
- [x] Implement Remote Config for model resolution with a fallback to `gemini-3.1-flash-lite-preview` for anonymous requests.
- [x] Update Exa integration to use `exa.search` (shallow search) for anonymous requests.
- [x] Add `X-Accel-Buffering: no` header to the SSE response to bypass Nginx/Cloud Load Balancer buffering.
- [x] Implement Stateful Resume: Cache intermediate state to Firestore right before emitting the `pql_gate` SSE event.
- [x] Bind `AbortController` to Express `req.on('close')` to terminate streams on client disconnect.

## Phase 2: Rate Limiting and PQL Tracking

- [x] Implement PQL usage tracking (max 3 teaser streams per anonymous IP/device fingerprint).
- [x] Reuse/integrate shared rate-limiting infrastructure from `/url-onboarding-plg`.
- [x] Add 429 response handling for anonymous limit breaches.

## Phase 3: Frontend PQL Gate & Design UX

- [x] Implement "Progressive Skeletons" during loading states to improve perceived latency.
- [x] Update SSE parser in `TrustBuilderScreen.tsx` hooks to recognize the `pql_gate` event and gracefully halt the accordion progression.
- [x] Implement "Blur Tease" design for the Tarpit Score to visually tease gated content.
- [x] Implement safe SSE error handling inside the `try/catch` parser block (call `setError` and `return` instead of `throw`).
- [x] Design and render the "Sign up to unlock your Tarpit Score and Strategy" Inline Safe Auth CTA.

## Phase 4: Authentication Flow & Latency Optimization

- [x] Ensure React state (Competitors, JTBD, Market Gaps) is cached to `sessionStorage` before unmounts.
- [x] Explicitly abort the active SSE stream _before_ calling `linkWithPopup`.
- [x] Implement `linkWithPopup` for the Inline Safe Auth CTA to smoothly upgrade anonymous users.
- [x] Add explicit error handling for `auth/credential-already-in-use` during the account merge process.
- [x] Call `auth.currentUser?.reload()` immediately after a successful account merge.
- [x] Enable resuming the Tarpit Score generation once authenticated: load the Firestore cached state to skip the Exa search and redundant LLM extraction steps.
