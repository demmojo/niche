# Testing Architecture Modernization

This specification outlines the modernization of `nicheai`'s testing strategy to align with 2026 industry standards, moving away from deep-mocking unit tests (the "Testing Pyramid") toward integration-heavy tests (the "Testing Trophy") and robust E2E API seeding.

## Features

### 1. Mock Service Worker (MSW) Integration Testing

- **Requirement:** Install and configure Mock Service Worker (`msw`) or utilize robust Firebase local emulators to intercept network requests during Vitest integration tests.
- **Requirement:** Refactor highly-mocked, brittle unit tests (e.g., `MarketAnalysis.test.tsx`, `UploadDataModal.test.tsx`) to remove deep component and hook mocks (`vi.mock('react-markdown')`, `vi.mock('../../hooks/useFirebaseSync')`).
- **Requirement:** Use React Testing Library to render the full component tree, asserting against user-visible DOM nodes and roles, while MSW handles mock API responses.

### 2. API Seeding for Playwright E2E Tests

- **Requirement:** Create backend or direct database seeding utilities (e.g., `test-utils/db-seed.ts`) that use the Firebase Admin SDK or emulator REST endpoints.
- **Requirement:** Refactor Playwright tests in `e2e/` to use these utilities for instantly provisioning required test data (e.g., creating a mocked user profile, setting up a sample whiteboarding session) _before_ test execution, rather than navigating the UI to create the data.
- **Requirement:** Ensure isolated state per test. Tests should clean up their own state or inject unique session IDs to prevent cascading failures in a sharded environment.

### 3. Flaky Test Quarantine Architecture

- **Requirement:** Establish a documented policy in `CONTRIBUTING.md` (or similar) that strictly mandates any E2E test failing intermittently on `main` must be immediately marked with `.skip()` and documented in a tracking system.
- **Requirement:** E2E suites should be stable; a red CI pipeline is more damaging to velocity than a temporarily disabled test.

### 4. Optimize Vitest Execution

- **Requirement:** Configure `vitest.config.ts` to disable isolation (`isolate: false`) for integration tests that don't pollute global state, speeding up test runs by reusing the V8 context.
- **Requirement:** Adjust the global coverage threshold strategy (currently 80% global) if necessary, prioritizing "New Code Coverage" for Integration paths over chasing 100% line coverage with brittle unit tests.

## Scenarios

- **WHEN** an integration test runs for a component that fetches data, **THEN** MSW seamlessly intercepts the outbound network request and returns the predefined mock response, allowing React Testing Library to render the "loaded" state without `vi.mock`ing the fetching hook.
- **WHEN** a Playwright E2E test for "Whiteboard Collaboration" starts, **THEN** it first calls an API seeding function that instantly inserts a whiteboard document into the emulator database. The Playwright test then simply navigates to the pre-existing whiteboard URL, bypassing the "Create New Whiteboard" UI flow entirely.
- **WHEN** a Playwright test fails randomly on GitHub Actions (flaky), **THEN** a developer immediately submits a PR with `.skip()` and a link to a bug tracker, restoring the `main` CI pipeline to green.
- **WHEN** a developer runs `npm run test` locally, **THEN** Vitest executes significantly faster by reusing contexts (`--no-isolate`), assuming tests properly clean up their own state in `afterEach` or via cleanup utilities.
