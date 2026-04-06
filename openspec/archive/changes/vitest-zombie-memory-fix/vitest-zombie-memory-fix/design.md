# Design: Vitest Zombie Memory Fix

## Context

Test suites running via Vitest often spawn multiple worker threads. When the system faces heavy memory pressure, V8 delays garbage collection, leading to huge heap sizes (1.3GB+). If the parent process (the terminal or IDE) is abruptly killed by the OS (OOM Killer), standard IPC disconnect events are never received by the worker, causing them to zombie.

## Goals

- Force V8 to garbage collect earlier.
- Ensure 100% reliable termination of worker processes if the parent process dies.

## Non-Goals

- Fixing underlying application memory leaks within individual test files.
- Rewriting the test execution engine.

## Decisions

- **Memory Limit Strategy**: Modify `execArgv` in `vitest.config.ts` (specifically via `scripts/test-utils/vitest-scaling.ts`) with `--max-old-space-size=512`. This is preferred over manual `global.gc()` calls as it relies on V8's native and optimized GC heuristics.
- **Orphan Detection Strategy**: Replace `process.on('disconnect')` with asynchronous PPID polling in `src/setupTests.ts`. Unix systems reassign orphaned processes to PID 1 (init/systemd). Polling `process.ppid === 1` guarantees detection of an abrupt parent crash.

## Risks/Trade-offs

- **Memory Cap Restriction**: 512MB might cause an OOM within the worker if a specific test legitimately requires more memory. We will need to monitor test failures for `JavaScript heap out of memory`.
- **Polling Overhead**: Running a `setInterval` adds marginal CPU overhead, but checking an integer (`process.ppid`) every 1000ms is negligible.
- **Cross-Platform Compatibility**: `process.ppid === 1` is standard for POSIX (Linux/macOS). Windows handles orphaned processes differently, which may require a fallback or conditional check if Windows support is strictly required.

## Future Potential

- Dynamic memory limits based on CI vs. Local environments.
- A dedicated native addon or Rust/Go helper for process management if Node's capabilities fall short.
