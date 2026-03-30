# Proposal

## Why

The `TrustBuilderScreen` and `scoringRoutes.ts` currently impose a hard authentication block on anonymous users, violating NicheAI's "Reverse Demo Hook" Product-Led Growth (PLG) strategy. We need to provide a "teaser" of value (optimistic AI outputs revealing Competitors, Jobs-to-be-Done (JTBD), and Market Gaps) to build trust before gating high-value insights behind a Product-Qualified Lead (PQL) sign-up wall.

## What Changes

- **Backend**: Route unauthenticated users to a teaser branch. Downgrade LLM to `gemini-3.1-flash-lite-preview` and Exa search to `exa.search`. Implement PQL usage tracking (max 3 streams). Emit a new `pql_gate` SSE before Tarpit Score generation.
- **Frontend**: Parse `pql_gate` event, gracefully halt the UI accordion, and render a "Sign up to unlock" CTA. Preserve React state to retain competitor/JTBD context upon authentication.

## Capabilities

- `idea-teaser-stream`
- `anonymous-pql-gating`

## Impact

Increases user conversion rates by demonstrating value upfront (Reverse Demo Hook) while minimizing compute costs for anonymous traffic.
