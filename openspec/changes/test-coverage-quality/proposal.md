# Proposal: Test New Changes, Measure Coverage, and Quality

## Why

Recent feature additions, including `ComputeMeter`, `TarpitWarningModal`, `ActionCredits`, `SafeAITask`, `CampaignRoutes`, and `ScoringEngine`, require robust intent-based tests to ensure absolute reliability. Core economic and value features must meet a 100% test coverage quality gate. In addition to ensuring execution coverage, we must objectively measure test assertion quality using mutation testing to guarantee the suite's effectiveness.

## What Changes

1. **Intent-Based Tests:** Comprehensive test suites for recently modified/added files using Vitest, React Testing Library (RTL), and MSW, focusing on user outcomes over implementation details.
2. **Integration Tests:** Backend tests utilizing Supertest and Firebase Local Emulator for Express routes and hooks to validate concurrency, TOCTOU (Time-Of-Check to Time-Of-Use) safety, and failure scenarios.
3. **Measurement Tooling:** Integration of Vitest's V8 native coverage provider and Stryker Mutator for mutation testing.

## Capabilities

- Provides realistic boundary/network mocking using MSW 2.x with `AbortSignal` handlers.
- Introduces strict execution coverage reporting (>= 95% overall, 100% core).
- Introduces mutation score reporting (> 80% baseline) to ensure assertions are highly restrictive and accurate.

## Impact

- Prevents regressions in core billing/credit logic and async AI task queues.
- Eliminates CI hangs and memory leaks through structured teardown logic and modern test architectural constraints.
- Ensures confidence in React 19 UI state transitions and Express 5.x error handling.
