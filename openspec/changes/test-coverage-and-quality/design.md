# Design: Test Coverage and Quality

## Context

Testing complex features like concurrent credit deductions, async AI task polling, and real-time Firebase syncing requires strict architectural patterns to prevent test flakiness, CI memory leaks, and false positives. We must establish a modern, scalable testing baseline for the repository.

## Goals

- Achieve 100% branch and statement coverage on newly implemented core components and hooks.
- Attain >80% mutation score on core files using Stryker.
- Implement strict concurrency tests for backend Express routes handling credits.
- Avoid implementation-detail testing in favor of user-intent and boundary testing.

## Non-Goals

- End-to-End (E2E) testing via Playwright (this is handled in a separate lifecycle/chore).
- Achieving 100% mutation score across the entire legacy monorepo (scoped only to target core files).
- Replacing Istanbul for completely unrelated historical projects right now (only for this modern Vitest pipeline).

## Decisions

- **V8 Coverage over Istanbul:** V8 is the native Vitest default, runs up to 30% faster without transpilation overhead, and consumes less memory.
- **MSW Interception over Direct Fetch Mocking:** MSW operates at the network boundary, ensuring tests accurately reflect realistic browser behavior. Finite delays with `AbortSignal` will be used to prevent hangs.
- **Supertest + Firebase Emulator:** Fast, localized integration testing is achieved by booting the emulator once globally and clearing data via REST API between tests rather than restarting the emulator.
- **Stryker Scoping:** Mutation testing is incredibly resource-intensive. Stryker will be isolated to run _only_ against pure unit/RTL tests (`*.test.tsx`, `*.test.ts`) avoiding emulator-bound backend tests.

## Risks & Trade-offs

- **Risk:** Memory leaks or CI hangs due to fake timers, unhandled promises, or lingering Firebase gRPC streams.
  - _Mitigation:_ Strict adherence to `afterEach`/`afterAll` teardown rules. Wrapping fake timers in `act()` and calling `admin.app().delete()` in backend tests.
- **Risk:** Mutation testing significantly increases CI runtime.
  - _Mitigation:_ Enable Stryker's incremental mode (`incremental: true`) and restrict execution to the explicitly modified files (`--mutate @`).

## Future Potential

Establishing this V8 + Stryker baseline allows us to eventually integrate CI bots that annotate PRs with mutation score deltas, fundamentally preventing weak tests from ever merging into the main branch.
