# Tasks

## Phase 1: Vector Math & AI Engines

- [x] Implement `calculateCosineSimilarity` with manual loop unrolling (by 4) for Float32Arrays.
- [x] Implement `calculateSquaredOrthogonalDistance` using `1 - (cosSim * cosSim)` to bypass heavy math calls.
- [x] Update `tarpitAnalyzer.ts` and `scoringEngine.ts` to include the niche preservation override.
- [x] Refactor backend memory handling to remove shared Float32Array scratchpad pools.

## Phase 2: Trust Builder UI

- [x] Create `TrustBuilderScreen` and define strict union types (`TrustBuilderStepId`).
- [x] Hoist `onSnapshot` listeners outside of React 19 `use()` Suspense boundaries.
- [x] Implement `AnimatedStep` component utilizing `onAnimationComplete` for decoupled queueing.
- [x] Add Queue Drain fast-forward logic for instant generation completions.

## Phase 3: Auth & PQL Gate

- [x] Overhaul `PQLGateModal.tsx` to display blurred generated artifacts.
- [x] Implement native `linkWithPopup` as the primary sign-in action.
- [x] Create backend Dual-JWT verification middleware.
- [x] Implement paginated `.limit(500)` recursive batch merge (via `runTransaction`) for backend artifact reparenting.
- [x] Refactor UI state logic to use `STATE_IDLE`, `STATE_MERGING`, `STATE_ERRORED` with an `AbortController`.
