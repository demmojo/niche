## Context

Currently, running parallel Vitest suites on developers' machines results in hard crashes of the Cursor IDE due to unconstrained JSDOM memory consumption. The existing mitigation in CI (`.github/workflows/ci.yml`) relies on `--no-isolate`, which sacrifices test isolation—a significant technical debt that invites cross-test state bleeding and makes debugging MSW/FakeTimers fragile.

## Goals / Non-Goals

**Goals:**

- Prevent Vitest from exhausting local RAM and crashing the IDE.
- Prevent CI from encountering OOM kills due to the "Container CPU Illusion".
- Re-enable strict test isolation in CI.
- Maximize test throughput contextually (slower local throughput for system stability; maximum safe CI throughput).

**Non-Goals:**

- Sharding the test suite across multiple CI machines (out of scope for now, though this configuration sets the groundwork for it).
- Replacing `jsdom` with `happy-dom` across the entire project (we will retain `jsdom` for compatibility but constrain its memory impact).

## Decisions

**1. Dynamic Fork Bounding via Shared Utility**

- **Decision**: Extract dynamic fork calculation logic into a centralized utility file (e.g., `scripts/test-utils/vitest-scaling.ts`) and apply it across all `vitest.*.ts` configs.
- **Rationale**: Ensures a single source of truth for CI environment detection (`process.env.CI`) and hardware boundary calculations (`os.cpus()`). Prevents configuration drift between standard tests, CLI tests, and stochastic Eval tests (DRY principle). Relying on Vitest's default thread calculation causes local resource starvation and CI crashes. Explicit bounding handles both environments gracefully.
- **Alternatives Considered**:
  - _Thread Pool_: Rejected because worker threads share memory limits in V8, accelerating OOMs with heavy JSDOM usage. `forks` (or `vmForks`) provides robust process boundaries.
  - _Duplicating Configs_: Rejected as an anti-pattern that makes future tuning fragile.

**2. Removing CI `--no-isolate` Hack**

- **Decision**: Remove `--no-isolate` from `.github/workflows/ci.yml`.
- **Rationale**: Once the pool is correctly bounded, we no longer need to share test context to save memory. True isolation guarantees test reliability and prevents state bleed.
- **Alternatives Considered**:
  - _Leave it disabled_: Rejected because it violates the isolation principles needed for robust stochastic LLM evals and integration tests.

**3. Memory-based Worker Limits & Garbage Collection**

- **Decision**: Utilize Vitest v3's `pool: 'vmForks'` to enable the `memoryLimit` API, or alternatively pass `--expose-gc` to standard `forks` to force garbage collection between test suites.
- **Rationale**: Standard `forks` ignore the `memoryLimit` option in Vitest v3. To get graceful worker recycling (preventing V8 heap exhaustion over long runs), we must either use `vmForks` with a `memoryLimit`, or manually trigger Node's garbage collector (`global.gc()`) after each test file to clean up heavy JSDOM contexts.

## Risks / Trade-offs

- **Risk: Slower Full Local Test Runs** -> Bounding local workers to 2-3 forks (instead of 8-10) will proportionally slow down a full local `npm run test:run` command.
- **Mitigation**: Standard local development uses watch mode (`npm run test`), which only executes tests affected by the immediate HMR graph, making the concurrency limit imperceptible for daily TDD. Full runs belong in CI.

## Future Potential & Wow Features

- **Predictive CI Sharding**: As the test suite grows, we can build a dynamic suite sharding calculator that automatically distributes execution across GitHub Actions matrices based on test execution time histories, eliminating long wait times completely.
- **Architectural / Design To-Do**: Investigate migrating non-layout-dependent tests from `jsdom` to `happy-dom` or `node` environment, which reduces memory overhead per worker by ~30%, allowing higher concurrency safely.
