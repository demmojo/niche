# Specification: NicheAI UX Strategy

## 1. Intent-Based Routing & Progress

**Scenario**: User starts the NicheAI onboarding process.

- **WHEN** the user lands on the entry screen (`ZeroFrictionEntry.tsx`),
- **THEN** they are presented with a single routing question with 3-5 options.
- **WHEN** an option is selected,
- **THEN** irrelevant features are dynamically pruned from the UI.
- **AND** a 3-5 step progress checklist appears, with the first step pre-completed ("Account Created ✓").
- **AND** the state transitions to an `EntryStep` Enum ("intent" | "input" | "analyzing" | "success" | "error").

## 2. Smart Defaults & Explainable States

**Scenario**: The AI begins fetching and analyzing market data.

- **WHEN** the user submits their intent,
- **THEN** the backend aggressively pre-populates competitor data via Exa/Apollo.
- **AND** the UI (`TrustBuilderScreen.tsx`) displays granular, real-time updates of the AI's labor via SSE.
- **AND** the React component resolves deferred promises created by `createDeferred<T>()` inside `Suspense` boundaries to avoid blocking the main thread.

## 3. JTBD and Gap Analysis

**Scenario**: The AI calculates market viability.

- **WHEN** the backend processes the data,
- **THEN** the Express route (`/api/scoring/stream`) parses the LLM JSON chunk conforming to `LLMExtractionSchema` which includes a strict Zod object for `jtbd` (`importance: z.number()`, `satisfaction: z.number()`).
- **AND** the route emits `{ type: 'jtbd_analysis' }` and `{ type: 'gap_analysis' }` events via SSE (`scoringRoutes.ts`).
- **AND** the `calculateOpportunityScore` math function calculates `Opportunity = Importance + Math.max(Importance - Satisfaction, 0)`.
- **AND** the Tarpit math logic adjusts the base Tarpit Score (`tarpitScore -= oppFactor * 20`) to reward high opportunity and penalize low opportunity.
- **AND** the `<JTBDStep>` and `<GapAnalysisStep>` Suspense boundaries reveal the extracted structured market deficits.

## 4. Activation (Reverse Demo Hook & IKEA Effect)

**Scenario**: User completes validation and wants to generate a campaign.

- **WHEN** the validation results are displayed,
- **THEN** the user can curate and edit the optimistic validation results to create investment (IKEA Effect).
- **WHEN** the user clicks "Generate Full Campaign",
- **THEN** they hit a PQL Gate requiring paid activation to proceed.
