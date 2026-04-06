# Proposal: Vitest Zombie Memory Fix

## Why

The current Vitest test suite suffers from severe memory management issues. V8 allows worker heap sizes to balloon up to 1.3 GB per worker before initiating garbage collection. Additionally, the existing graceful `process.on('disconnect')` approach fails during abrupt OOM (Out of Memory) SIGKILL events. This leaves worker threads orphaned as zombie processes, draining system resources and ultimately crashing parent IDEs (like Cursor).

## What Changes

1. **Aggressive Garbage Collection**: Inject `--max-old-space-size=512` into the Node `execArgv` for Vitest workers.
2. **Zombie Process Watcher**: Implement a PPID (Parent Process ID) polling watcher that checks if the parent process has died and issues a raw `SIGKILL` if orphaned.

## Capabilities

- Cap memory usage per worker thread to ~512MB.
- Automatically and reliably terminate orphaned test workers regardless of blocked event loops or abruptly killed parent processes.

## Impact

- **Stability**: Prevents the IDE and local development environment from OOM crashing due to runaway V8 memory allocation.
- **Resource Management**: Guarantees orphaned Vitest workers are instantly terminated upon a parent crash, freeing up system RAM and CPU.
