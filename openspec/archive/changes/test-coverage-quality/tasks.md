# Tasks

### Phase 1: Unit & Intent-Based Testing for New Components

- [ ] Setup standardized RTL custom `render` wrapper injecting necessary providers.
- [ ] Implement intent-based tests for `src/components/ComputeMeter.tsx` using `getByRole`.
- [ ] Implement intent-based tests for `src/components/TarpitWarningModal.tsx`.
- [ ] Configure MSW to mock API interactions with active `AbortSignal` binding.
- [ ] Ensure React 19 `useTransition` behavior is validated without `act` warnings.

### Phase 2: Hooks & Utilities Testing

- [ ] Write test suite for `src/hooks/useActionCredits.ts` covering deduction success/failure flows.
- [ ] Write test suite for `src/hooks/useFirebaseSync.ts` covering offline/online sync states.
- [ ] Write test suite for `src/hooks/useSafeAITask.ts` using MSW 202 Accepted and Firebase `onSnapshot` mocks.
- [ ] Write boundary/math constraint tests for `src/utils/scoringEngine.ts`.
- [ ] Extract latency tests for `scoringEngine` into `scoringEngine.bench.ts`.
- [ ] Enforce strict timer teardown (`vi.useRealTimers()`, `vi.clearAllTimers()`) in `afterEach` blocks.

### Phase 3: Backend Routes & Integration Tests

- [ ] Setup Supertest against exported Express app testing `campaignRoutes.ts` and `credits.ts`.
- [ ] Integrate Firebase Local Emulator booting and REST API-based data clearing between tests.
- [ ] Implement TOCTOU Chaos Tests triggering simultaneous credit deductions.
- [ ] Verify Zod `discriminatedUnion` rejections and `<>` prompt injection sanitization.
- [ ] Verify Express 5.x 413 error status code payload limits.
- [ ] Add strict `afterAll` teardown (`await admin.app().delete()`) to prevent gRPC hangs.

### Phase 4: Coverage and Quality Measurement

- [ ] Configure Vitest V8 native coverage provider.
- [ ] Run `npx vitest run --coverage --hanging-process` (or `--pool=forks`) to ensure 100% core coverage and detect open handles.
- [ ] Configure `stryker.config.json` targeting only modified core files (`--mutate @` or `incremental: true`).
- [ ] Isolate Stryker execution from the Firebase Emulator dependency suite.
- [ ] Execute Stryker to generate baseline mutation report and ensure > 80% mutation score.
