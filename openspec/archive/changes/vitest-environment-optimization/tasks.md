# Tasks

## Phase 1: Configuration

- [x] Update `vitest.config.ts` to configure `environmentMatchGlobs`.
- [x] Map `src/__tests__/utils/**`, `src/__tests__/server/**`, `src/__tests__/firestore/**`, and `src/__tests__/workers/**` to the `node` environment.

## Phase 2: Pragma Injection

- [x] Run the test suite to identify tests failing due to missing DOM globals.
- [x] Add `// @vitest-environment jsdom` to `src/__tests__/utils/storage.test.ts`.
- [x] Add `// @vitest-environment jsdom` to `src/__tests__/utils/telemetry.test.ts`.
- [x] Add `// @vitest-environment jsdom` to `src/__tests__/utils/apiKeys.test.ts`.

## Phase 3: Teardown Safety

- [x] Open `src/setupTests.ts`.
- [x] Add `process.on('disconnect', () => process.exit())` to ensure clean exit logic on runner disconnect.

## Phase 4: Validation

- [x] Run the full test suite.
- [x] Verify execution time duration has reduced to ~121s.
- [x] Verify memory max heap usage drops to ~30MB per test.
- [x] Force-kill the parent runner mid-execution and verify no orphaned node processes remain in the system.
