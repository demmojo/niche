# Tasks

## Phase 1: Backend & AI Overhauls

- [x] Update `scoringEngine.ts` and `tarpitAnalyzer.ts` with Orthogonal Vector Distance logic.
- [x] Implement System Override threshold bypass for hyper-niche ideas.
- [x] Refactor `scoringRoutes.ts` to stream intermediate insights (e.g., competitor count, tarpit score).

## Phase 2: Trust Builder UI

- [x] Build new `TrustBuilderScreen` component.
- [x] Implement React 19 `use()` pattern for handling the streamed validation data.
- [x] Add Radix Accordion and Motion `layout` to the Trust Builder for smooth step expansion.

## Phase 3: Reverse Demo PQL Gate

- [x] Overhaul `PQLGateModal.tsx` to include the blurred/gradient overlay UI.
- [x] Implement secure background artifact rendering (preventing DOM leakage of sensitive paid data via skeleton states).
- [x] Update microcopy to Save Your Analysis and apply loss aversion CTA principles.
- [x] Wire up `usePQLUpgrade.ts` to coordinate with the new modal flow.

## Phase 4: Testing & Polish

- [x] Write unit tests for Niche Preservation threshold logic.
- [x] Conduct E2E testing of the streaming labor illusion flow and step expansion.
- [x] Verify PQL conversion analytics events fire correctly.
