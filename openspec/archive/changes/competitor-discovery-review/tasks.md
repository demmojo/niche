# Tasks: Competitor Discovery Review Flow

## Phase 1: API & Scoring Engine

- [x] Scaffold `POST /api/campaign/discover-competitors` Express route.
- [x] Implement `exa-js` heuristic search using `site:reddit.com` and `site:g2.com` modifiers based on user intent.
- [x] Create Zod schema for competitor scoring: `name, domain, description, similarityScore, matchTier, matchRationale`.
- [x] Implement Gemini Flash prompt via `zodToJsonSchema` to map Exa results to the 3 tiers.
- [x] Wrap LLM call with `withModelFallback` to ensure reliability.

## Phase 2: Frontend Implementation

- [x] Add `discoveryQueue` state variable in `App.tsx` or `ValidationArena.tsx`.
- [x] Update `DeepValidationButton` click handler to intercept empty competitor lists.
- [x] Build the staggered loading state components ('Querying Exa...', 'Analyzing overlap...').
- [x] Build the `CompetitorDiscoveryModal` component.
- [x] Implement the Keep/Discard toggle logic on competitor cards.

## Phase 3: Integration & Clean-up

- [x] Connect the modal's 'Confirm' button to the existing `handleGlobalSync` campaign trigger.
- [x] Modify `src/server/campaignRoutes.ts` (approx line 297) to bypass the legacy automated BullMQ fallback if competitors are already provided via the new flow.
- [x] Write integration tests for the new endpoint ensuring proper empty-state and error-state handling.
