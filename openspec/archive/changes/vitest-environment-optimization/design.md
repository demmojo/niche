# Design

## Context

Currently, Vitest runs all tests in `jsdom` by default. Many backend, server, and utility tests do not require a DOM, resulting in wasted resources and execution overhead.

## Goals

- Optimize overall test suite execution time.
- Lower memory consumption per test run.
- Prevent orphaned Node test processes from consuming system resources.

## Non-Goals

- Rewriting the tests or test logic themselves.
- Replacing Vitest with an alternative test runner.

## Decisions

- Use `environmentMatchGlobs` in `vitest.config.ts` to map specific directories (`utils`, `server`, `firestore`, `workers`) to the `node` environment.
- Add a process `disconnect` listener in `src/setupTests.ts` for clean worker exits.

## Risks & Trade-offs

- **Risk**: Some utility tests might implicitly depend on `window` or `localStorage` despite being classified as utilities.
- **Mitigation**: Add `// @vitest-environment jsdom` specifically to identified utility tests (e.g., storage, telemetry, API keys) to preserve their functionality.

## Future Potential

- Further parallelization and sharding of the test suite.
- Extending the node environment mapping to future backend-heavy modules.
