# Feature Plan: PLG Teaser for Idea Validation

## Why

The `TrustBuilderScreen` and `scoringRoutes.ts` currently impose a hard authentication block on anonymous users, violating NicheAI's "Reverse Demo Hook" Product-Led Growth (PLG) strategy. We need to provide a "teaser" of value—optimistic AI outputs revealing Competitors, Jobs-to-be-Done (JTBD), and Market Gaps—to build trust before gating the high-value insights (Tarpit Score, Final Product Strategy, and saved history) behind a Product-Qualified Lead (PQL) sign-up wall.

## What Changes

- **Backend (`src/server/scoringRoutes.ts`)**:
  - Update `/api/scoring/stream` to detect anonymous/unauthenticated users and route them to a "teaser" execution branch.
  - Downgrade the LLM model to `gemini-3.1-flash-lite-preview` for anonymous requests to minimize compute costs.
  - Downgrade the Exa search configuration to exclude deep content retrieval (`exa.search` instead of `exa.searchAndContents`), relying on snippets/titles for the teaser phase.
  - Implement PQL usage tracking for the endpoint (e.g., max 3 teaser streams per anonymous IP/device fingerprint), utilizing shared infrastructure with `/url-onboarding-plg`.
  - Emit a new `pql_gate` Server-Sent Event (SSE) right before the Tarpit Score generation phase.
- **Frontend (`src/components/TrustBuilderScreen.tsx` & hooks)**:
  - Update the SSE parser to recognize the `pql_gate` event type.
  - Upon receiving `pql_gate`, gracefully halt the accordion progression without throwing a fatal error boundary.
  - Render a "Sign up to unlock your Tarpit Score and Strategy" Call-To-Action (CTA) in place of the final scoring sections.
  - Ensure the existing React state is preserved so users do not lose the generated competitor/JTBD context when they authenticate.

## Capabilities

- `idea-teaser-stream`
- `anonymous-pql-gating`

## Design/Architecture

- **Cost Containment**: Strictly avoid expensive API calls (deep Exa searches, heavy `gemini-3.1-pro` prompts) for unauthenticated traffic.
- **React 19 Best Practices**: Enforce `AbortController` patterns in frontend data fetching hooks (e.g., `useFirebaseSync`, SSE hooks) to prevent "Snapshot Beats the Fetch" race conditions and gracefully handle unmounts if the user clicks the CTA to sign up mid-stream.
- **Backend Resilience**: Bind an `AbortController` to `req.on('close')` in the Express SSE endpoint to immediately terminate Gemini and Exa streams if the anonymous client disconnects.
- **Authentication Flow**: Utilize `linkWithPopup` to upgrade anonymous accounts to persistent accounts smoothly, preserving the React state populated by the teaser stream (as per AGENTS.md).
