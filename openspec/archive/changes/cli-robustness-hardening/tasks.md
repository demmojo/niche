# Tasks

### Phase 0: Deprecation Warning & Feature Flag Configuration

- [x] **Task 0.1**: Ensure `stderr` deprecation warnings are explicitly emitted and NEVER suppressed, even when `process.env.CI` is true, enforcing visibility.
- [x] **Task 0.2**: Update Zod schemas to strictly reject unknown flags via `.strict()`, and strictly parse the CLI flags, and implement string-to-boolean coercion.
- [x] **Task 0.3**: Add the `--format=v2` feature flag logic to bypass flat JSON representations.

### Phase 1: Test Scaffolding

- [x] **Task 1.1**: Write `swapStagingToLive.test.ts` to assert that `swapStagingToLive` restores files from the local `.tmp/` staging directory upon synthetic failure. Ensure tests use ESM `fs` mocking (`vi.mock("fs")`) rather than `memfs` to accurately track file descriptors and assert zero EMFILE leaks in `afterEach`. Ensure parallel Vitest blocks generate unique `.tmp/[ExpiryTimestamp]-[UUID]` paths to prevent cross-test corruption.
- [x] **Task 1.2**: Write tests in `stage.test.ts` to assert `git diff --cached --quiet` accurately bypasses empty commits, and verify `git commit --no-verify` successfully bypasses local pre-commit hooks.
- [x] **Task 1.3**: Write an `EPIPE` mock test asserting that global handlers suppress traces and trigger graceful shutdowns.
- [x] **Task 1.4**: Write tests for TOCTOU drift detection to verify the `--apply` command rejects invalid SHA-256 staging tokens.
- [x] **Task 1.5**: Write tests for the CLI `flushStreamsAndExit` wrapper, ensuring the test manually resolves the wrapper's promise within the mocked exception catch-block of the asynchronous stream drain callback to prevent unhandled rejection hangs.
- [x] **Task 1.6**: Write tests ensuring CLI flag validation via Zod schemas and verify the `resolveConfinedPath` utility correctly blocks directory traversal payload attacks.

### Phase 2: staging directory & Explicit Recovery Implementation

- [x] **Task 2.1**: Update `swapStagingToLive.ts` to execute all file mutations exclusively within a dedicated `.tmp/[UUID]` staging directory. Implement a rapid sequence of `fs.renameSync` calls to swap the validated staging directory into the live workspace by first moving the old workspace to a temporary `_old` path.
- [x] **Task 2.2**: Remove all legacy `try/catch` rollback logic, LIFO restoration algorithms, and Write-Ahead Log (WAL) tracking from `swapStagingToLive`, embracing true crash-only atomic swaps.
- [x] **Task 2.3**: If `process.env.CI` is true and a failure occurs _before_ the atomic swap, preserve state for CI debugging. However, because regex-based secret scrubbing of entire source trees is brittle and prone to leakage in public CI artifacts, the CLI MUST strictly allow-list the files it exports to `.openspec-failed-artifacts/[UUID]`. It will ONLY export `stderr.log`, `stdout.log`, `stacktrace.txt`, and the `openspec.json` metadata file. The CLI MUST implement an error sanitizer that explicitly defines an allowlist of safe error fields (e.g., `error.code`, `error.message`) to extract and serialize.
- [x] **Task 2.4**: Implement an asynchronous, non-blocking boot-time sweep of the `.tmp/` directory using `fs.promises.opendir`. `opendir` provides an async iterator that streams directory entries one by one, scaling infinitely with O(1) memory usage regardless of how many abandoned directories exist.
- [x] **Task 2.6**: Implement a boot-time CI artifact sweep that explicitly deletes `.openspec-failed-artifacts/` directories older than 48 hours, explicitly swallowing `ENOENT`, `ENOTEMPTY`, `EBUSY`, and `EPERM` to prevent matrix CI race conditions.

### Phase 3: Global Terminal Boundary & Payload Resiliency

- [x] **Task 3.1**: Modify the `StdioRouter` module to bind an `.on('error')` handler to `process.stdout` that specifically swallows `EPIPE` errors ONLY during JSON payload emission. The CLI MUST explicitly call `removeListener` in a `finally` block immediately after the payload emission succeeds to prevent memory leaks.
- [x] **Task 3.2**: Replace all internal `process.exit()` calls with structured errors (containing explicit `exitCode` properties) so the CLI entry `flushStreamsAndExit` wrapper can handle process termination cleanly while preserving the exact numeric exit codes historically returned to downstream consumers.
- [x] **Task 3.3**: Implement the `StdioRouter` module to enforce `stderr` logging and `stdout` JSON emission via simple exported functions, including the explicit `--payload-dump-dir=<path>` opt-in flag. Ensure payload files are written with `O_EXCL | O_CREAT` (`wx` flag) and strict `0o600` permissions.
- [x] **Task 3.4**: Implement strict Zod schema parsing for all CLI flags (banning Commander `.opts()`) and build the `resolveConfinedPath` utility to enforce absolute path confinement within staging contexts.

### Phase 4: Staging Isolation & Git Hygiene

- [x] **Task 4.1**: Refactor `stage.ts` to completely eradicate `node_modules` symlinking/hard-linking. Implement dependency hydration via a bounded `npm ci --prefer-offline --no-audit --ignore-scripts --fund=false`.
- [x] **Task 4.2**: Inject `git diff --cached --quiet` checks prior to `git commit`. Implement the chunked stream secret scanner (using fixed-window boundaries or entropy checks for long lines, and a strict 2MB per-file size limit to prevent ReDoS/Event Loop starvation) during the `--stage` phase inside the `.tmp/` directory.
- [x] **Task 4.3**: Refactor `git status` extraction pipelines to strictly enforce `--porcelain -z` with a simple array iterator loop.
- [x] **Task 4.4**: Update `cleanupOldStaged`. The asynchronous boot-time sweep will iterate through all `.tmp/staging-*`, `.tmp/failed-*`, and orphaned `.tmp/workspace_old_*` directories and attempt removal in the background.
- [x] **Task 4.5**: Replace the detached background child process garbage collector with a simple, asynchronous boot-time sweep of the `.tmp/` directory.
- [x] **Task 4.6**: Implement atomic TOCTOU prevention using fast native Node.js filesystem hashing (e.g., `crypto.createHash('sha256')`). The CLI must explicitly re-hash and verify working tree parity immediately before the final `fs.renameSync` swap to detect manual edits.
- [x] **Task 4.7**: Ensure NPM registry credentials are never written to disk or injected into the global `process.env`. The CLI MUST securely provision an ephemeral `.npmrc` inside the workspace's _local_ `.tmp/[UUID]/` staging directory (with strict `0600` permissions).
