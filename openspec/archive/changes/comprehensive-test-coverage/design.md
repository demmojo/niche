## Context

The NicheAI codebase has reached a ~80% coverage threshold. However, many backend routes, rate-limiting systems, telemetry event processing logic, LLM pipeline tools, and background queues (`queues.ts`, `tarpitFlywheel.ts`) lack coverage. This results in the test suite occasionally missing core business logic.

## Goals / Non-Goals

**Goals:**

- Raise the coverage for `LLMPenaltyBox.ts`, `llmRoutes.ts`, `queues.ts`, `rateLimit.ts`, `scoringRoutes.ts`, `sse.ts`, `telemetryRoutes.ts`, `tarpitFlywheel.ts`, `mathUtils.ts`, `imageUtils.ts`, and `telemetry.ts` to 100% or near it.
- Implement robust intent-based tests mapping directly to real-world user flows and API calls using MSW and Vitest.
- Mock external dependencies (`BullMQ`, `Firebase-Admin`, `LLM APIs`) precisely and consistently across isolated modules.

**Non-Goals:**

- Refactoring the core logic of the uncovered files to make them testable (unless absolutely necessary due to untestable tight coupling).
- Adding missing E2E (Playwright) tests. This spec is focused on Vitest unit/integration coverage.

## Decisions

**1. Mocking BullMQ and Firebase Admin Contexts**

- **Decision**: Centralize the mocks in isolated test files rather than a global setup, or rely heavily on `vi.resetModules()` to prevent test pollution.
- **Rationale**: Firebase's `onSnapshot` and `runTransaction` are heavily stateful. By isolating tests and mocking only the required Firebase namespaces per test file, we ensure reliable, non-flaky intent-based tests.
- **Alternatives Considered**:
  - _Global Setup Mocking_: Rejected because it creates tight coupling between disparate tests and introduces race conditions.

**2. Utilizing MSW for Telemetry and SSE Mocks**

- **Decision**: Server-Sent Events (SSE) and external Webhooks will be mocked using custom Node stream/event emitter mocking instead of full network simulation where possible to speed up tests.
- **Rationale**: Proper intent-based tests for these systems must mock the boundaries rather than internals to verify message delivery correctly.

## Risks / Trade-offs

- **Risk: Increased Test Time** -> Adding comprehensive mock-heavy coverage may increase the CI run time.
- **Mitigation**: Utilize Vitest's concurrent execution and parallel thread pools.

## Future Potential & Wow Features

- **Auto-Generating Tests Engine**: Leverage AI-powered dynamic intent mapping to self-generate missing test cases from usage telemetry.
- **Architectural / Design To-Do**: Abstract complex dependencies into cleaner DI (Dependency Injection) modules to minimize mocking overhead in tests.
