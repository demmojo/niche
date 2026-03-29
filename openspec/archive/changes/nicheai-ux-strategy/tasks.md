# Tasks: NicheAI UX Strategy

## Phase 1: Setup & Routing

- [x] 1.1 **Test:** Write failing MSW/Firebase Emulator intent-based tests for `ZeroFrictionEntry` checking for intent options and transition states.
- [x] 1.2 **Implement:** Update `src/components/ZeroFrictionEntry.tsx` to implement Intent-Based Routing (3-5 options).
- [x] 1.3 **Implement:** Implement UI pruning based on the selected intent.

## Phase 2: Scoring Engine & Backend

- [x] 2.1 **Test:** Write failing unit tests in `src/__tests__/utils/scoringEngine.test.ts` for `calculateOpportunityScore` and the new schema parsing.
- [x] 2.2 **Implement:** Update `src/utils/scoringEngine.ts` to expand `LLMExtractionSchema`. Include `jtbd` (importance/satisfaction) and `market_gaps` sub-objects.
- [x] 2.3 **Implement:** Implement Anthony Ulwick's JTBD formula inside `calculateOpportunityScore` and integrate it into `calculateTarpitScore`.
- [x] 2.4 **Implement:** Update `src/server/scoringRoutes.ts` to use partial JSON streaming (or at least full AST streaming) to emit `{ type: 'jtbd_analysis' }` and `{ type: 'gap_analysis' }` SSE events.

## Phase 3: UI Integration & Activation

- [x] 3.1 **Test:** Write failing RTL tests in `src/__tests__/components/TrustBuilderScreen.test.tsx` for the new `jtbd_analysis` and `gap_analysis` chunk handling.
- [x] 3.2 **Implement:** Update `src/components/TrustBuilderScreen.tsx` to use `createDeferred()` for the new SSE events.
- [x] 3.3 **Implement:** Inject `<JTBDStep>` and `<GapAnalysisStep>` Suspense boundaries into `TrustBuilderScreen.tsx`.
- [x] 3.4 **Implement:** Implement the "Labor Illusion" granular update UI (`aria-live="polite"`).

## Phase 4: Final Validation

- [x] 4.1 Verify targeted local coverage (`npm run test -- <changed-files> --coverage`) meets the 80-100% threshold.
