## 1. Config Modernization & Shared Utility

- [ ] 1.1 **Refactor:** Create a shared utility (e.g., `scripts/test-utils/vitest-scaling.ts`) exporting a function like `getSafePoolOptions()` that calculates `maxForks` and `minForks` based on `process.env.CI` and hardware limits.
- [ ] 1.2 **Implement:** Update the utility to either use `pool: 'vmForks'` with a explicit `memoryLimit`, OR `pool: 'forks'` with `execArgv: ['--expose-gc']` for manual garbage collection.
- [ ] 1.3 **Implement:** Update `vitest.config.ts`, `vitest.cli.config.ts`, and `vitest.eval.config.ts` to import and spread the `getSafePoolOptions()` configuration.

## 2. CI Pipeline Hardening

- [ ] 2.1 **Implement:** Remove the `--no-isolate` flag from the `Run Unit Tests` step in `.github/workflows/ci.yml`.

## 3. Validation

- [ ] 3.1 Verify the local testing experience via `npm run test` executes without freezing the OS/IDE. Use Vitest's `--logHeapUsage` flag to mathematically prove the memory leak is contained.
- [ ] 3.2 Verify the CI pipeline executes and passes reliably by creating a PR with this feature.
