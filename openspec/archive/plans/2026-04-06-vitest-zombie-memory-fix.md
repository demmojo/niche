# Vitest Zombie Memory Fix

## Objective

Address the remaining memory leak and zombie process issues in the Vitest test suite. Even after environment optimization, V8 allows worker heap sizes to balloon up to 1.3 GB per worker before garbage collecting. Furthermore, the previous graceful `process.on('disconnect')` approach fails during an abrupt OOM SIGKILL, leaving worker threads orphaned and consuming system resources.

## Changes

1. **Aggressive Garbage Collection**: Add `--max-old-space-size=512` to `execArgv` inside `vitest.config.ts` (via `scripts/test-utils/vitest-scaling.ts`) to force V8 to collect garbage earlier, capping memory at ~512MB per worker instead of 1.3GB+.
2. **Zombie Process Watcher (PPID Polling)**: Replace the standard `disconnect` IPC event with a bulletproof asynchronous PPID polling watcher in `src/setupTests.ts`. This watcher checks every second if `process.ppid` has changed to `1` (indicating the parent IDE/terminal was killed), and issues a raw `SIGKILL` to bypass blocked event loops.

## Impact

- **Stability**: Prevents the Cursor IDE from OOM crashing due to runaway V8 memory allocation.
- **Resource Management**: Guarantees orphaned Vitest workers are instantly terminated upon a parent crash, freeing up system resources.
