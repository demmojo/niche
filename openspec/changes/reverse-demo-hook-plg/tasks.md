# Tasks: Reverse Demo Hook PLG

## Phase 1: Decouple the UI & Enforce Compute Boundaries

- [x] Refactor `ZeroFrictionEntry.tsx` to stop auto-chaining APIs after fast analysis.
- [x] Add "Generate Full Campaign" button to display Zero-Shot Value.
- [x] Implement `PQLGateModal.tsx` to intercept and gate Pro-Tier access.
- [x] Create `fetchWithAppCheck` utility and enforce `X-Firebase-AppCheck` headers on all anonymous requests.

## Phase 2: Resolve the Race Conditions & Firestore Limits

- [x] Implement `isMergingRef` state freeze in `usePQLUpgrade.ts` (or `AuthProvider`).
- [x] Rewrite `/api/auth/merge-anonymous-data` backend logic to use `.limit(500)` iterative batching instead of a monolithic transaction.
- [x] Audit and enforce strict `.update()` field paths in all BullMQ worker writes to prevent overwrites.

## Phase 3: Restore >80% Test Coverage

- [x] Configure MSW to return HTTP 202 Accepted immediately for job mocks.
- [x] Implement floating promise simulator for the local Firebase Emulator to mock async worker resolution.
- [x] Write intent-based race condition tests in `usePQLUpgrade.test.tsx`.
- [x] Run coverage reports to verify >80% coverage on Lines, Functions, Statements, and Branches.
