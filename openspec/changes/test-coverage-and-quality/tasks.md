# Tasks

## Phase 1: Unit & Intent-Based Testing for New Components

- [ ] Create centralized RTL `render` wrapper injecting required providers.
- [ ] Write intent-based tests for `ComputeMeter.tsx` using `getByRole` for states/animations.
- [ ] Write intent-based tests for `TarpitWarningModal.tsx` validating React 19 `useTransition` behaviors.
- [ ] Setup MSW network boundaries and ensure `AbortSignal` listener binding to prevent test leakage.
- [ ] Verify 100% branch coverage on both component files.

## Phase 2: Hooks & Utilities Testing

- [ ] Implement `useActionCredits.ts` tests covering deduction success and failure states.
- [ ] Implement `useFirebaseSync.ts` tests for offline/online states.
- [ ] Implement `useSafeAITask.ts` tests decoupling the 202 Accepted HTTP response from the async Firebase `onSnapshot` queue completion.
- [ ] Write `scoringEngine.ts` math boundary tests (divide-by-zero, asymmetric arrays).
- [ ] Extract absolute latency assertions into a dedicated `scoringEngine.bench.ts` file.
- [ ] Standardize fake timers: `vi.useFakeTimers`, `advanceTimersByTimeAsync` within `act()`, and clear in `afterEach`.

## Phase 3: Backend Routes & Integration Tests

- [ ] Setup Supertest with the exported Express app.
- [ ] Configure global Firebase Local Emulator boot and `DELETE /emulator/v1/projects/...` REST API call for fast inter-test data clearing.
- [ ] Write Chaos/TOCTOU tests in `credits.test.ts` triggering simultaneous requests to ensure `runTransaction` serialization.
- [ ] Write validation tests in `campaignRoutes.test.ts` for prompt injection sanitization and Zod union rejections.
- [ ] Write Express 5.x 413 payload limit rejection tests.
- [ ] Ensure `afterAll` calls `admin.app().delete()` to prevent gRPC hangs.

## Phase 4: Coverage and Quality Measurement

- [ ] Run `vitest run --coverage` with the V8 provider and `--hanging-process` flag to catch leaks.
- [ ] Generate coverage report to guarantee >= 95% overall and 100% for core targets.
- [ ] Configure `stryker.config.json` enabling `incremental: true` and limiting targets via `--mutate @`.
- [ ] Isolate Stryker execution strictly to `*.test.tsx` and `*.test.ts` (pure UI/unit tests).
- [ ] Run Stryker and achieve >80% mutation score on target core files.
