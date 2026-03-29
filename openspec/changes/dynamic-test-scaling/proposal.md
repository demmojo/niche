## Why

Vitest frequently crashes the local IDE and developer environment (e.g. Cursor, VSCode) when running heavy tests (like JSDOM/React testing) in parallel because it blindly defaults to utilizing `os.cpus().length - 1` cores. On modern machines, this easily exhausts available RAM, triggering Out-Of-Memory (OOM) kills.

Conversely, in CI environments (like standard GitHub Actions running in Docker), the runner reports the host machine's total CPUs (often 64+) instead of the container's 2 allocated vCPUs. This "Container CPU Illusion" leads to immediate OOM failures unless tests are run completely isolated (which slows them down or causes bleed-over if `--no-isolate` is used as a workaround).

We need an efficient testing system that prevents local crashes while maximizing CI performance safely.

## What Changes

Introduces a dynamic, hardware-and-environment-aware resource allocation strategy for the test runner.

The configuration (`vitest.config.ts`, `vitest.cli.config.ts`, `vitest.eval.config.ts`) will scale the concurrent execution pool dynamically based on:

1. `process.env.CI` detection.
2. Available hardware resources (RAM and Logical Cores).

Additionally, it removes testing anti-patterns like using `--no-isolate` in CI, replacing them with correctly scoped memory-bounded forks.

## Capabilities

### New Capabilities

- `dynamic-worker-allocation`: Automatically calculate the safe number of test workers based on available RAM (locally) and strict container boundaries (CI).
- `vm-memory-limits`: Recycle Vitest worker processes when they exceed a safe memory threshold to prevent gradual V8 heap exhaustion over long test runs.

### Modified Capabilities

- `ci-testing-pipeline`: Upgraded to run with full isolation enabled, bounded by explicit `minForks` and `maxForks` configurations, stopping OOM crashes without compromising test state integrity.
