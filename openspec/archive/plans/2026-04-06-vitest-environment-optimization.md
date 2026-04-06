# Vitest Environment Optimization

## Objective

Optimize the testing suite by preventing memory leaks and drastically reducing execution time. Currently, Vitest runs all tests in the heavy `jsdom` environment. We will selectively run non-UI tests (utils, server, firestore, workers) in the lighter and faster `node` environment, and correctly terminate forks.

## Changes

1. **Vitest Config**: Use `environmentMatchGlobs` in `vitest.config.ts` to map `src/__tests__/utils/**`, `src/__tests__/server/**`, `src/__tests__/firestore/**`, and `src/__tests__/workers/**` to the `node` environment.
2. **Utils Tests**: Add `// @vitest-environment jsdom` pragma to specific utils tests that genuinely rely on browser globals like `localStorage` or `window` (e.g. `storage.test.ts`, `telemetry.test.ts`, `apiKeys.test.ts`).
3. **Vitest Runner Safety**: Add a process disconnect listener in `src/setupTests.ts` to ensure worker processes exit cleanly if the parent process (IDE or runner) crashes, avoiding zombie memory leaks.

## Metrics

- **Duration**: ~200s -> ~121s (nearly 40% reduction)
- **Heap Usage**: Max heap per test dropped from ~50MB to ~30MB.
