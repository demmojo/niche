## Context

Our recent codebase review revealed that `nicheai` employs an aggressive global 80% coverage threshold but relies heavily on shallow testing (deep mocking of internal hooks like `useFirebaseSync` or component dependencies like `lucide-react`). While our Playwright E2E suite runs in a sharded matrix, it still uses UI interactions to set up test scenarios, leading to longer execution times and potential flakiness.

In 2026, top-tier tech companies and unicorns have moved past the "Testing Pyramid" and strict global coverage metrics. Instead, they champion the "Testing Trophy" (heavy integration tests, light unit tests) and use API Seeding for E2E tests, which provides higher confidence and ROIs.

## Goals / Non-Goals

**Goals:**

- Implement Mock Service Worker (MSW) or Firebase Emulators to mock the network boundary instead of React hooks.
- Refactor brittle unit tests in `src/__tests__/` to test component behavior (integration tests via React Testing Library).
- Implement an API Seeding strategy for Playwright tests using Firebase Admin SDK or local state injection to bypass UI setup.
- Define a strict Quarantine Policy for flaky E2E tests.

**Non-Goals:**

- Refactor every single test in the repository at once (this will be done iteratively).
- Add 100% mutation testing coverage to the whole repo (only target critical domains).

## Decisions

**1. Shift from Deep Mocking to Integration Testing**

- **Decision**: Use MSW (Mock Service Worker) to intercept Firebase or REST calls during Vitest tests instead of `vi.mock` for internal React logic.
- **Rationale**: Tests should assert what the user sees and does, not the implementation details of internal hooks. If the hook's structure changes but the app still functions, the test should pass.
- **Alternatives Considered**:
  - _Mocking individual hooks_: Current approach. Highly brittle, requires rewriting tests every time a component is refactored.

**2. Implement E2E API Seeding**

- **Decision**: Create a `test-utils/db-seed.ts` utility (using Firebase Admin SDK or directly manipulating emulator state) to instantly provision required data before a Playwright test.
- **Rationale**: Eliminates the "flakiness tax" of clicking through multi-step wizards just to get the system into the state required for the actual test scenario.
- **Alternatives Considered**:
  - _UI setup for every test_: Current approach. Slows down execution and increases the chance of timeout failures on GitHub Actions runners.

**3. Quarantine Flaky Tests**

- **Decision**: Adopt a "Quarantine Policy" where any E2E test that fails intermittently is immediately marked with `.skip()` and documented in a Linear/Jira ticket.
- **Rationale**: A broken `main` branch destroys engineering velocity. Temporarily losing E2E coverage is better than a red CI pipeline that blocks deployments.

## Risks / Trade-offs

- **Risk: Increased test execution time for Integration tests vs shallow Unit tests.** -> Transitioning from shallow rendering to full component tree rendering can increase Vitest execution time.
- **Mitigation**: Ensure `vitest.config.ts` continues to use `isolate: false` (`--no-isolate`) where possible, and run tests selectively on staged files via Lefthook.

- **Risk: Complexity in setting up MSW / Emulators.** -> MSW requires writing robust mock handlers for Firebase data structures, which is an initial setup hurdle.
- **Mitigation**: Start by mocking the most critical/brittle endpoints first and gradually expanding the MSW handlers.
