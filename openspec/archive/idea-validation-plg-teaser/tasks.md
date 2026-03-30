# Tasks

## Phase 1: Backend (`src/server/scoringRoutes.ts`)

- [x] Detect anonymous/unauthenticated users in `/api/scoring/stream`.
- [x] Implement conditional model usage: `gemini-3.1-flash-lite-preview` for anon users.
- [x] Downgrade Exa search config to `exa.search` for anon users.
- [x] Implement PQL usage tracking (max 3 teaser streams per IP/device).
- [x] Emit `pql_gate` SSE right before the Tarpit Score generation phase.
- [x] Bind `AbortController` to `req.on('close')` to terminate Gemini and Exa streams upon disconnect.

## Phase 2: Frontend (`src/components/TrustBuilderScreen.tsx`)

- [x] Update SSE parser to handle the `pql_gate` event type.
- [x] Halt accordion progression gracefully upon receiving `pql_gate`.
- [x] Render the "Sign up to unlock your Tarpit Score and Strategy" CTA.
- [x] Implement `AbortController` patterns in frontend hooks to prevent race conditions during unmounts/mid-stream signups.
- [x] Integrate `linkWithPopup` flow for the CTA to upgrade the anonymous account while preserving existing React state.
