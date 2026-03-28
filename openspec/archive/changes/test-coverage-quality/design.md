# Design: Test Suite Architecture & Quality

## Context

The recent introduction of numerous system-critical features (Action Credits, Safe AI Tasks, Scoring Engines) demands a modernized testing approach. Relying solely on happy-path execution is insufficient; we need architectural safeguards against concurrency issues, memory leaks during tests, and brittle implementation-focused UI testing.

## Goals

- Achieve 100% test execution coverage on newly added core files.
- Achieve > 80% mutation score on modified core files.
- Maintain fast, leak-free CI execution.

## Non-Goals

- E2E testing framework overhaul (Playwright testing exists but is out-of-scope for this specific unit/integration phase).
- Rewriting historical test suites to meet the 100% mutation testing threshold (applies to new core files only).

## Decisions

- **Coverage Provider:** Use Vitest V8 instead of Istanbul. V8 is native to Vitest (2026), runs up to 30% faster without transpilation preprocessing, and consumes less memory.
- **Network Mocking:** Intercept at the network boundary using MSW 2.x rather than spying on or mocking `fetch` directly. This enables highly realistic integration testing.
- **Mutation Testing:** Introduce Stryker Mutator but restrict its execution to pure unit/RTL test suites (incremental mode or specific file scoping) to avoid catastrophic CI delays caused by running it against the Firebase Emulator.

## Risks/Trade-offs

- **Risk:** Memory leaks or CI hangs due to open handles from fake timers or MSW promises.
  - **Mitigation:** Strict enforcement of `afterEach` / `afterAll` teardowns (`vi.useRealTimers()`, `vi.clearAllTimers()`, `await admin.app().delete()`). MSW finite delays combined with `AbortSignal` listeners will be used instead of infinite delays.

## Future Potential

Establishing this baseline enables strict enforcement hooks (Husky/Lint-Staged) preventing any future PRs that dip below the established 100% core coverage or 80% mutation score marks.
