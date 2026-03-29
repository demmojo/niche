# Dynamic Test Scaling

A configuration architecture to prevent memory exhaustion (OOM crashes) during parallel testing in both local IDEs and constrained CI environments.

## Features

### 1. Environment-Aware Vitest Configuration

- **Requirement:** A centralized utility must explicitly define `poolOptions` to constrain the number of active test processes, avoiding configuration drift across `vitest.config.ts`, `vitest.cli.config.ts`, and `vitest.eval.config.ts`.
- **Requirement:** Locally, `maxForks` should be limited (e.g., max 3 or based on free memory) to preserve IDE stability.
- **Requirement:** In CI, `maxForks` should map precisely to the standard runner's vCPU allocation (e.g., 2) to override the Container CPU Illusion.
- **Requirement:** The pool must handle memory bloat gracefully, either via `vmForks` with a `memoryLimit`, or by exposing Node's Garbage Collector (`--expose-gc`) for manual cleanup between test suites.

### 2. CI Pipeline Modernization

- **Requirement:** The `.github/workflows/ci.yml` pipeline must execute unit tests with full isolation, removing the `--no-isolate` band-aid now that memory is strictly governed.

## Scenarios

_Note: Every scenario MUST map 1:1 to an intent-based test using RTL/MSW/Firebase Emulator._

- **WHEN** executing tests in a local environment without `CI` flag
- **THEN** Vitest spawns a restricted number of forks (e.g. <= 3), leaving sufficient CPU/RAM for Cursor and background services.

- **WHEN** executing tests in the GitHub Actions CI environment
- **THEN** Vitest spawns exactly the allocated CI forks (e.g., 2), with `--isolate` enabled, running the suite to completion without triggering an OOM kill.
