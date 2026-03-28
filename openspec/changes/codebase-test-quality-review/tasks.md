# Tasks: Codebase Bug Hunt and Test Quality Review

## Phase 1: Test Quality Audit & Refactoring

- [ ] Replace brittle array-based selectors (`getAllByText()[0]`) with explicit, accessible queries (`getByRole`, `findByRole`) across files: `App.test.tsx`, `AppSync.test.tsx`, `MyProduct.test.tsx`, `DataPointsTable.test.tsx`, `SyncReviewModal.test.tsx`.
- [ ] Remove `vi.mock` configurations that aggressively bypass boundaries (e.g., `useFirebaseSync`, `useApprovalStore`).
- [ ] Standardize a strict TypeScript console mock interceptor in `setupTests.ts` containing a readonly allow-list, causing test failures for unexpected errors.
- [ ] Implement V8 coverage gates in configuration.
- [ ] Create independently targeted config files (`vitest.config.ts` for DOM, `vitest.cli.config.ts` for Node).
- [ ] Replace custom server mocks in `server.test.ts` and Apollo API boundaries with strictly validated MSW handlers.

## Phase 2: Coverage Expansion & Static Fixture Creation

- [ ] Capture 5+ static hardcoded API JSON fixtures (OpenAI, Gemini) into a `__fixtures__` folder.
- [ ] Intercept outbound `generativelanguage.googleapis.com` and `api.openai.com` requests via MSW pointing to local fixtures.
- [ ] Write missing tests manually for Critical CLI/Utils: `ast-scanner.ts`, `drift.ts`, `ragValidation.ts`.
- [ ] Write missing tests manually for Orchestrators: `UnifiedIdeationEngine.tsx`, `AiThinkingDag.tsx`, `IntentRouter.tsx`.
- [ ] Write missing tests manually for Utilities/Engines: `hashWorkerAPI.ts`, `imageUtils.ts`, `VisualWhiteboard.tsx`, `RapidPdlcWorkflow.tsx`, `ToolboxEngine.tsx`.

## Phase 3: Domain-Driven Bug Hunt

- [ ] **Domain A (Core UI & State)**: Review Zustand stores and `VisualWhiteboard.tsx` for race conditions, direct mutations, or async closure issues.
- [ ] **Domain B (API & Services)**: Review `aiClient.ts` and `geminiClient.ts` to ensure missing `try/catch` JSON parse blocks, robust HTTP 429 handlers, and `AbortController` timeouts are correctly implemented.
- [ ] **Domain C (CLI & Tooling)**: Implement the DFS DAG algorithm in `openspec-cli` to detect and gracefully report cyclic references, verify regex frontmatter robustness.
- [ ] Write a failing test for every discovered bug FIRST, implement the fix, then verify.

## Phase 4: Resolution & Verification

- [ ] Configure Playwright setup using Firebase Admin SDK and Local Emulators (via `test.extend` fixtures) to seed state, skipping onboarding wizards.
- [ ] Run the complete pipeline (Vitest + Playwright).
- [ ] Verify there are zero `.skip()` instances left without corresponding Jira/Github issues.
- [ ] Verify coverage minimum thresholds line up with target standards.
