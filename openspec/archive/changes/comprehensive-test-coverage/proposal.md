## Why

Our test coverage is currently at ~80% across the codebase, missing the desired goal of near 100% test coverage. Significant pieces of core architecture—such as `LLMPenaltyBox.ts`, `queues.ts`, `rateLimit.ts`, `scoringRoutes.ts`, `sse.ts`, `tarpitFlywheel.ts`, `mathUtils.ts`, `imageUtils.ts`, and `telemetry.ts`—lack complete coverage. Without comprehensive intent-based test coverage using Vitest, MSW, RTL, and Firebase Emulators, the platform risks regressions during rapid iteration, specifically on key background worker workflows, user telemetry, rate-limiting, and complex LLM pipelines.

## What Changes

Introduces comprehensive, intent-based testing utilizing a combination of `Vitest`, `React Testing Library`, `MSW` for network mocking, and `Firebase-Admin` module isolation strategies. This spec details the scenarios and strategies needed to cover the remaining gaps and increase the `statements`, `branches`, `functions`, and `lines` coverage to near 100%.

## Capabilities

### New Capabilities

- `comprehensive-coverage`: Ensures robust safety nets for critical user flows by bumping overall test coverage to near 100% and addressing entirely uncovered logic.
- `intent-based-validation`: Shifts testing focus toward user intents rather than implementation details to prevent brittle tests.

### Modified Capabilities

- `ci-cd-pipeline`: The existing test suite will be larger, capturing more complex application states, such as `rateLimit` and `sse`.

## Impact

This will touch the `src/__tests__/` directory almost entirely, with no changes to production code architecture, effectively strengthening the reliability of the backend services, background workers, and internal utilities.
