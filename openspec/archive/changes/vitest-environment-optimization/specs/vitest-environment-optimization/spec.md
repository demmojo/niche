# Spec

## Detailed Features

1. **Environment Mapping**: `vitest.config.ts` applies `environmentMatchGlobs` to route non-UI paths to `node`.
2. **Pragma Overrides**: Specific test files use inline comments to force `jsdom` when needed, overriding the glob pattern.
3. **Runner Safety**: A global listener detects runner crashes and tears down orphaned processes cleanly.

## Scenarios

**Scenario 1: Running Backend/Utility Tests**

- **WHEN** a test in `src/__tests__/utils/**` or `src/__tests__/server/**` is executed.
- **THEN** it runs in the `node` environment by default.

**Scenario 2: Running DOM-dependent Utility Tests**

- **WHEN** `storage.test.ts` (which contains `// @vitest-environment jsdom`) is executed.
- **THEN** Vitest overrides the glob configuration and runs the specific file in `jsdom`.

**Scenario 3: Parent Process Crash**

- **WHEN** the parent test runner (IDE plugin or CLI process) crashes or disconnects.
- **THEN** the worker process's `disconnect` listener in `setupTests.ts` triggers and immediately calls `process.exit()`, preventing a zombie memory leak.
