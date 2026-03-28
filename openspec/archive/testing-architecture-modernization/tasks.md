## 1. Setup and Tooling

- [x] 1.1 Install `msw` (Mock Service Worker) as a dev dependency.
- [x] 1.2 Create `src/test-utils/browser.ts`, `src/test-utils/server.ts`, and `src/test-utils/handlers.ts` to configure MSW for intercepting REST/Firebase/Gemini requests.
- [x] 1.3 Update `src/setupTests.ts` to start the MSW server before all tests (`beforeAll`), reset handlers after each test (`afterEach`), and close the server after all tests (`afterAll`).
- [x] 1.4 Update `vitest.config.ts` to use `--no-isolate` (`isolate: false`) for faster execution. Check for and mitigate global state pollution in existing tests.

## 2. Refactoring to the Testing Trophy

- [x] 2.1 Identify 2-3 highly mocked unit tests (e.g., `MarketAnalysis.test.tsx` or `UploadDataModal.test.tsx`).
- [x] 2.2 Refactor these tests to remove `vi.mock` for internal React hooks and third-party UI components.
- [x] 2.3 Use React Testing Library to render the component tree and write assertions against user-visible elements (roles, text). Ensure MSW correctly intercepts and mocks the underlying network requests.

## 3. E2E API Seeding

- [x] 3.1 Create a utility file `e2e/utils/db-seed.ts` containing functions to directly manipulate local Firebase Emulator data (or inject via a dedicated `/api/test/seed` endpoint if applicable) for Playwright tests.
- [x] 3.2 Refactor an existing Playwright test (e.g., `NavigationFlow.spec.ts` or a new test) to use `db-seed.ts` for provisioning required state _before_ the test executes, bypassing the UI setup steps.
- [x] 3.3 Ensure the refactored Playwright test cleans up its seeded data or uses unique identifiers to prevent cross-test contamination in the parallel matrix.

## 4. Documentation and Policy

- [x] 4.1 Update `CONTRIBUTING.md` to document the new Testing Trophy strategy, the use of MSW for integration testing, and the requirement for API Seeding in E2E tests.
- [x] 4.2 Document the "Quarantine Policy" for flaky Playwright tests in `CONTRIBUTING.md`.
- [x] 4.3 (Optional) Adjust global coverage thresholds in `vitest.config.ts` if the shift to integration tests naturally lowers raw line coverage but increases confidence. Consider implementing "New Code Coverage" tracking in CI.
