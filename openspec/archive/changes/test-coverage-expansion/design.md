# Design: Test Coverage Expansion

## Context

NicheAI prioritizes a lightweight architecture. Implementing rigorous 80% branch coverage requires ensuring testing tools (Vitest 3, React 19, Firebase Emulators, MSW) interact flawlessly without introducing CI bottlenecks, Out-Of-Memory (OOM) freezes, or architectural bloat.

## Goals

- Achieve strict >80% branch and intent-based test coverage.
- Ensure tests run concurrently without database collisions via dynamic test project IDs.
- Completely teardown test environments to prevent memory leaks and V8 crashes.

## Non-Goals

- Adopting heavily abstracted Dependency Injection (DI) or Hexagonal Architecture.
- Using Stochastic Evaluation LLM CI layers (which violate YAGNI and introduce flakiness).

## Decisions

1. **Direct Emulator Integration:** Bind `src/server/*Routes.ts` directly to the Firebase Emulator. This preserves exact transaction boundaries (`runTransaction`) without over-engineering.
2. **Dynamic Project IDs:** Use `crypto.randomUUID()` or `VITEST_POOL_ID` to isolate Firebase Emulators per Vitest worker suite.
3. **Strict Teardowns:** Mandate `NODE_ENV === 'test'` guards, `memoryLocalCache()`, and explicit `afterAll` cleanups (REST DELETE, `terminate()`, `deleteApp()`, and global instance deletion).
4. **Pure Function Parsers:** Decouple `SafeJsonStream.ts` into deterministic pure functions suitable for `fast-check` testing.
5. **State Machines for Race Conditions:** Replace boolean flags with explicit states and Correlation IDs to resolve "Snapshot Beats the Fetch" race conditions.

## Risks & Trade-offs

- **Risk:** Firebase Emulators are slower than pure unit tests.
  **Mitigation:** Push 65% of the overall coverage requirements to pure unit tests (zero emulators) and run emulator tests in isolated parallel pools.
- **Risk:** Vitest 3 `useFakeTimers` mixed with MSW causes indefinite freezes or V8 OOM crashes.
  **Mitigation:** Strict enforcement of `vi.runOnlyPendingTimers()` and `vi.useRealTimers()` in `afterEach` test blocks.

## Future Potential

Paves the way for fully automated continuous delivery pipelines by guaranteeing that no critical user journeys or database transaction flows break during rapid feature iteration.
