# Tasks

## Phase 1: Tarpit Flywheel & Foundations

- [x] Implement global Vitest strict teardown (Firebase `deleteApp`, `clearIndexedDbPersistence`).
- [x] Integrate `fast-check` and `zod-fast-check` dependencies.
- [x] Write Property-Based Testing (PBT) implementation for LLM stream parsers.
- [x] Implement RTL UX Intent tests for the Reverse Demo Hook (asserting `<dialog>`).

## Phase 2: Market Intelligence Tests

- [x] Write RTL tests to verify `AbortController` usage gracefully degrades to partial UI data instead of a fatal Error Boundary.
- [x] Implement "Snapshot Beats the Fetch" MSW/Firebase race condition tests.

## Phase 3: Validation Arena Integration

- [x] Implement `vi.useFakeTimers()` unit tests targeting `aria-live` sequential messages.
- [x] Write tests to simulate React 19 `startTransition` interruptions triggered by concurrent `onSnapshot` updates.

## Phase 4: CI/CD Stochastic Evaluation Layer

- [x] Create stochastic baseline scripting (`measureVariance` for mean/std-dev).
- [x] Create the LLM-as-Judge evaluation utility (`evaluatePairwise`).
- [x] Wire up `*.eval.test.ts` isolated execution in a dedicated GitHub Actions workflow.
