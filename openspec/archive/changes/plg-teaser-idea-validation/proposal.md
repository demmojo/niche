# Proposal: PLG Teaser for Idea Validation

## Why

The `TrustBuilderScreen` and `scoringRoutes.ts` currently impose a hard authentication block on anonymous users, violating NicheAI's "Reverse Demo Hook" Product-Led Growth (PLG) strategy. We need to provide a "teaser" of value—optimistic AI outputs revealing Competitors, Jobs-to-be-Done (JTBD), and Market Gaps—to build trust before gating the high-value insights (Tarpit Score, Final Product Strategy, and saved history) behind a Product-Qualified Lead (PQL) sign-up wall.

## What Changes

- **Backend (`src/server/scoringRoutes.ts`)**: Route `/api/scoring/stream` to detect unauthenticated users. Implement Remote Config for model resolution (fallback to `gemini-3.1-flash-lite-preview`) and use shallow `exa.search` instead of deep content retrieval. Ensure the `X-Accel-Buffering: no` header is set for streaming resilience. Implement Stateful Resume by caching intermediate state to Firestore and emitting a `pql_gate` Server-Sent Event (SSE) right before the Tarpit Score generation, allowing the backend to skip Exa searches post-auth.
- **Frontend (`src/components/TrustBuilderScreen.tsx`)**: Introduce Progressive Skeletons for loading and a "Blur Tease" visual effect for the Tarpit Score. Update SSE parser to recognize `pql_gate`, use safe SSE error handling (`setError` instead of throwing), and render an Inline Safe Auth CTA.
- **Auth & React Integration**: Prior to calling `linkWithPopup`, abort the active SSE stream and cache state to `sessionStorage`. Handle `auth/credential-already-in-use` errors gracefully and explicitly call `auth.currentUser?.reload()` after a successful merge.

## Capabilities

- `idea-teaser-stream`
- `anonymous-pql-gating`

## Impact

Removes friction for first-time users, builds product trust through immediate upfront value delivery, drastically reduces compute cost for unauthenticated traffic, ensures seamless state preservation (Stateful Resume), and drives higher conversion rates to registered accounts.
