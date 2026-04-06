# Tasks: Vitest Zombie Memory Fix

## Phase 1: Implement V8 Memory Limit

- [x] Open `scripts/test-utils/vitest-scaling.ts` (or the file responsible for Vitest config generation).
- [x] Update the `poolOptions` (or equivalent thread/fork configuration) to include `execArgv: ['--max-old-space-size=512']`.
- [x] Run a local test suite and monitor memory usage to ensure workers stay under 600MB.

## Phase 2: Implement Zombie Process Watcher

- [x] Open `src/setupTests.ts`.
- [x] Remove or deprecate reliance on `process.on('disconnect')` for cleanup if it exists.
- [x] Add a `setInterval` timer that runs every 1000ms.
- [x] Inside the interval, check `if (process.ppid === 1)`.
- [x] If true, execute `process.kill(process.pid, 'SIGKILL')`.
- [x] Ensure the interval is `unref()`'d so it doesn't artificially keep the event loop alive (`timer.unref()`).

## Phase 3: Validation

- [x] Run the full test suite locally.
- [x] Force-kill the parent Vitest process using `kill -9 <parent_pid>`.
- [x] Verify using `ps aux | grep vitest` that no zombie worker processes remain.
- [x] Push to CI and verify test stability.
