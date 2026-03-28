## Why

The current testing suite enforces strict 80% global test coverage but relies heavily on "deep mocking" (mocking every internal hook and dependency) and UI-driven E2E setup. As a result, the tests are brittle—breaking when implementation details change—and the E2E suite is prone to flakiness due to repetitive UI interactions for test setup. To align with 2026 top-tier engineering standards (like Meta, Stripe, and modern unicorns), we need to shift our testing strategy to emphasize confidence and execution speed over vanity metrics.

## What Changes

We are modernizing the testing architecture by shifting to the "Testing Trophy" methodology. This involves:

1. Transitioning from heavily mocked unit tests to integration tests using Mock Service Worker (MSW) or Firebase Emulators to mock the network boundary instead of component internals.
2. Implementing API Seeding for Playwright E2E tests, allowing tests to set up required state via backend utilities rather than UI clicks.
3. Establishing a Flaky Test Quarantine policy and exploring New Code Coverage vs. Global Coverage thresholds.

## Capabilities

### New Capabilities

- `api-test-seeding`: Dedicated backend utilities (using Firebase Admin SDK or direct emulator inserts) to seed deterministic test data instantly before an E2E test runs.
- `network-boundary-mocking`: Use MSW (Mock Service Worker) to intercept REST/GraphQL/Firebase requests during Vitest integration tests, removing the need to `vi.mock` internal React hooks.

### Modified Capabilities

- `vitest-suite`: Shift focus from testing isolated React components with mocked children to testing full component trees (Integration Tests).
- `e2e-suite`: Remove redundant UI setup steps (like logging in manually via UI for every test) in favor of injected authentication state and seeded data.

## Impact

This will impact the `src/__tests__/` directory and `e2e/` directory. Developers will spend less time fixing brittle tests after refactoring code, and the CI/CD pipeline will be more stable due to reduced UI flakiness in E2E tests.
