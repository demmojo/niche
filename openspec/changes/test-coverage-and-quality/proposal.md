# Proposal: Test New Changes, Measure Coverage, and Quality

## Why

Recent feature additions including `ComputeMeter`, `TarpitWarningModal`, `ActionCredits`, `SafeAITask`, `CampaignRoutes`, and `ScoringEngine` form the core economic and value pathways of the application. To ensure robust reliability and meet project quality gates, we must back these additions with comprehensive intent-based testing. Furthermore, subjective testing is insufficient; we need objective metrics for test execution coverage and assertion quality to guarantee the suite's effectiveness.

## What Changes

1. **Intent-Based Tests:** Addition of comprehensive test suites using Vitest, React Testing Library (RTL), and MSW for newly modified/added UI components.
2. **Backend & Integration Tests:** Implementation of Supertest against Express routes with the Firebase Local Emulator, focusing on concurrency and TOCTOU (Time-Of-Check to Time-Of-Use) scenarios.
3. **Coverage Measurement:** Configuration of Vitest using the native V8 coverage provider.
4. **Quality Measurement:** Introduction of Stryker Mutator to dynamically test test-suite assertion quality via mutation testing.

## Capabilities

- Accurately measure unit and integration test coverage across UI, hooks, and backend code.
- Simulate complex asynchronous UI states (React 19 `useTransition`) and API interactions without brittle internal mocks.
- Identify surviving mutants in the test suite, highlighting tests that execute code but fail to assert behavior.
- Safely manage backend state in CI using fast setup/teardown with the Firebase Local Emulator REST API.

## Impact

- **Reliability:** Prevents regressions in core user and economic flows.
- **Quality Metrics:** Achieves 100% coverage on core files and a baseline mutation score of >80%.
- **CI Stability:** Eliminates hanging CI processes through strict teardown protocols and MSW `AbortSignal` listener implementations.
