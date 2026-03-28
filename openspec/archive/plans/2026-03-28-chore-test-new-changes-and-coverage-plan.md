---
title: Test New Changes, Measure Coverage, and Quality
type: chore
status: active
date: 2026-03-28
---

# Test New Changes, Measure Coverage, and Quality

## Overview

This chore implements comprehensive unit, integration, and intent-based testing for recent core feature additions, specifically targeting the new changes related to credits, safe AI tasks, scoring engines, and UI components. Additionally, it establishes a baseline for test coverage using Vitest's V8 provider and introduces test quality measurement via mutation testing (Stryker).

## Problem Statement

Recent feature additions (ComputeMeter, TarpitWarningModal, ActionCredits, SafeAITask, CampaignRoutes, and ScoringEngine) require robust intent-based tests to ensure reliability. We need 100% coverage on these core economic/value features to meet project quality gates. We also need to objectively measure both test _execution coverage_ (V8) and test _assertion quality_ (Mutation Testing) to guarantee the suite's effectiveness.

## Proposed Solution

1. **Implement Intent-Based Tests:** Write comprehensive test suites for the recently modified/added files using Vitest, React Testing Library (RTL), and MSW. Focus on user outcomes, avoiding implementation details.
2. **Integration Tests:** Add tests for Express routes and hooks, ensuring correct behavior under concurrency and failure scenarios.
3. **Measure Coverage:** Configure and run Vitest with the native V8 coverage provider to reach the >= 95% overall and 100% core coverage targets.
4. **Measure Quality:** Introduce Stryker Mutator to evaluate test quality (mutation score target > 80%).

## Technical Approach

### Architecture

- **Unit & UI Intent-Based Tests:** Vitest + React Testing Library + `user-event` v14.
- **Network/Boundary Mocking:** MSW 2.x (using finite delays and `AbortSignal` listeners to prevent CI hangs).
- **Backend/Integration:** Supertest + Vitest + Firebase Local Emulator.
- **Coverage Tool:** Vitest V8 native coverage provider.
- **Quality Tool:** Stryker Mutator for JavaScript/TypeScript.

### Implementation Phases

#### Phase 1: Unit & Intent-Based Testing for New Components

- **Files:**
  - `src/components/ComputeMeter.tsx`
  - `src/components/TarpitWarningModal.tsx`
- **Tasks & Deliverables:**
  - Write RTL intent-based tests using a centralized custom `render` wrapper that injects necessary providers.
  - Do not mock child components; only mock non-deterministic browser APIs.
  - Use `getByRole` for assertions to test UI states: visibility, animations/transitions, and disabled/enabled states based on credits.
  - Test React 19 `useTransition` behavior to ensure async state transitions do not trigger "act" warnings.
  - Mock any API/Network interactions using MSW. Ensure MSW handlers actively bind to `AbortSignal` to prevent leaks.
- **Success Criteria:** 100% branch coverage on these components.

#### Phase 2: Hooks & Utilities Testing

- **Files:**
  - `src/hooks/useActionCredits.ts`
  - `src/hooks/useFirebaseSync.ts`
  - `src/hooks/useSafeAITask.ts`
  - `src/utils/scoringEngine.ts`
- **Tasks & Deliverables:**
  - Test explicit hook behaviors (e.g., credit deduction success/failure, Firebase offline/online sync states, and SafeAITask error recovery).
  - For `useSafeAITask`, mock MSW to immediately return `202 Accepted { jobId: '123' }` and use a mock Firebase `onSnapshot` event to test the decoupled async job queue architecture.
  - Test `scoringEngine.ts` math boundaries (divide-by-zero, asymmetric arrays, V8 cmov optimizations) for correctness. Move absolute latency tests (< 1ms) to a dedicated `scoringEngine.bench.ts` Vitest benchmark file.
  - Scope fake timers narrowly (`vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval', 'Date'] })`).
  - Use fake timers (`vi.advanceTimersByTimeAsync()`) wrapped in `act()` for async operations, ensuring strict teardown (`vi.useRealTimers()`, `vi.clearAllTimers()`) in `afterEach`.
- **Success Criteria:** Hooks and scoring engine meet 100% test coverage.

#### Phase 3: Backend Routes & Integration Tests

- **Files:**
  - `src/server/campaignRoutes.ts`
  - `src/server/credits.ts`
- **Tasks & Deliverables:**
  - Setup Supertest targeting the exported Express app. Boot the Firebase Local Emulator once globally and use the REST API (`DELETE /emulator/v1/projects/...`) to clear data between tests to optimize speed.
  - Implement Chaos Testing and TOCTOU (Time-Of-Check to Time-Of-Use) tests. Specifically, trigger two simultaneous `Supertest` requests to deduct credits and verify that `runTransaction` successfully serializes them.
  - Include explicit tests for prompt injection sanitization (`replace(/[<>]/g, '')`) and Zod `discriminatedUnion` rejections (ensuring 400 Bad Request is returned).
  - Verify Express 5.x 413 error status codes and payload limits.
  - Add strict teardown in `afterAll` (`await admin.app().delete()`) to prevent Firebase gRPC streams from hanging the Vitest process.
- **Success Criteria:** Backend routes handle concurrency without state leakage; 100% coverage.

#### Phase 4: Coverage and Quality Measurement

- **Tasks & Deliverables:**
  - Run `npx vitest run --coverage` (V8) with `--hanging-process` (or `--pool=forks`) to detect open handles.
  - Configure `stryker.config.json` for the NicheAI codebase to use incremental mode (`incremental: true`) or mutate only the specific files modified in this chore (`--mutate @`).
  - Isolate Stryker to run **only** against the pure unit/RTL test suite (`*.test.tsx`, `*.test.ts`) to avoid massive CI delays from hitting the Firebase Local Emulator.
  - Run Stryker Mutator to measure test suite quality and identify surviving mutants in the core files.
  - Generate and review coverage/mutation reports.
- **Success Criteria:** V8 coverage report generated (target 100% for core changes). Mutation score for core files > 80%.

## Alternative Approaches Considered

- **Istanbul Coverage vs V8:** We selected V8 coverage as it is the native Vitest default for 2026, runs up to 30% faster without pre-processing, and consumes less memory.
- **Mocking Fetch directly vs MSW:** Decided against direct `fetch` mocking. MSW intercepts at the boundary, providing more realistic testing without brittle internal mock setups.

## Acceptance Criteria

### Functional Requirements

- [ ] All new components (`ComputeMeter`, `TarpitWarningModal`) have intent-based RTL tests.
- [ ] All new hooks (`useActionCredits`, `useFirebaseSync`, `useSafeAITask`) are tested.
- [ ] `scoringEngine.ts` is tested for boundary conditions and performance constraints.
- [ ] Backend routes (`campaignRoutes.ts`, `credits.ts`) have integration tests covering concurrency/TOCTOU scenarios.

### Quality Gates

- [ ] 100% coverage achieved on the specified new files.
- [ ] Stryker Mutation testing executed, with a baseline mutation score reported.
- [ ] No infinite hangs in CI (ensure MSW `delay('infinite')` is avoided; use `AbortSignal`).

## Success Metrics

- 100% Execution coverage (V8) on all modified files.
- > 80% Mutation Score on modified files via Stryker Mutator.
- E2E Efficacy: Playwright test suite passes reliably.

## Dependencies & Risks

- **Dependencies:** Vitest, RTL, Supertest, MSW 2.x, Firebase Emulator Suite, Stryker Mutator.
- **Risks:** Memory leaks or CI hangs due to improper teardown of fake timers or MSW promises. Mitigated by strict `afterEach` teardown rules.

## References & Research

### Internal References

- Intent-Based Testing Brainstorm: `openspec/brainstorms/2026-03-27-intent-based-ai-testing-brainstorm.md`
- Core architecture & tooling facts: `AGENTS.md`

### Best Practices

- Use V8 coverage provider for Vitest.
- Strict RTL query priority: `getByRole` → `getByLabelText` → `getByPlaceholderText` → `getByText`.
- MSW Timeout Handlers: Use long finite delays with `AbortSignal` rather than `delay('infinite')`.
