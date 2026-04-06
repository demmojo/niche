# Spec: Vitest Zombie Memory Fix

## Detailed Features

### 1. V8 Memory Limiting

Modify the Vitest pool configuration to pass `--max-old-space-size=512` to the worker processes. This instructs the V8 engine to cap the old space generation at 512MB, triggering garbage collection much earlier than the default behavior.

### 2. Zombie Process Watcher

In `src/setupTests.ts` (or equivalent global setup), initiate a `setInterval` that runs every 1000ms. The interval evaluates `process.ppid`. If `process.ppid === 1`, it immediately triggers `process.kill(process.pid, 'SIGKILL')` to terminate the worker unconditionally.

## Scenarios

### Scenario 1: Memory pressure reaches the new limit

- **WHEN** a Vitest worker process allocates memory approaching 512MB.
- **THEN** V8 triggers a major garbage collection cycle.
- **AND** the memory footprint shrinks without crashing the host machine.

### Scenario 2: Parent process gracefully exits

- **WHEN** the Vitest CLI finishes or is cancelled gracefully (SIGINT).
- **THEN** workers terminate cleanly via standard IPC/disconnect pathways.

### Scenario 3: Parent process abruptly dies (OOM Killer)

- **WHEN** the parent process (IDE/Terminal) is killed via `SIGKILL` without notifying children.
- **THEN** the worker's `process.ppid` is reassigned to `1` by the OS.
- **AND** the Zombie Process Watcher detects this on the next 1-second tick.
- **AND** the worker process terminates itself using `SIGKILL`.
