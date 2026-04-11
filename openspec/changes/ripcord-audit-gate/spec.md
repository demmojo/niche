# Specification: Ripcord Audit Gate & CLI Hardening

## Overview

Technical implementation for decoupling ML evaluations from fast-paths, overhauling concurrency with `proper-lockfile`, enforcing Git-Native Atomicity for fail-safe staging, handling V1->V2 migration, and enforcing container-resilient E2E paradigms.

## 1. The Ripcord Action & Event Loop Yielding

- **Dynamic Imports:** Refactor `index.ts` and command fast-paths to remove static `@google/genai` imports.
- **Streaming & Backpressure:** Implement `pipeline(mlStream, hashTransform, fs.createWriteStream)` for large payloads.
- **Yield Generator:** Inject an async generator that calls `await new Promise(r => setImmediate(r))` every 50ms into cryptographic streams.
- **Timeout Bound:** Wrap ML calls in `AbortSignal.timeout(30000)`.

## 2. OS-Native Locking (`proper-lockfile`)

- **Mutex Implementation:** Use the `proper-lockfile` package targeting `<baseDir>/.tmp/openspec.lock`.
- **Lock Acquisition:** Wrap mutative CLI commands inside `lock()` and `release()`.
- **Stale Lock Resolution:** Configure `proper-lockfile` with `stale: 15000` (15 seconds) to natively manage lock hijacking without custom polling or EBUSY retry loops.

## 3. Git-Native Atomicity (Isolated Worktrees)

- **Isolated Worktree Initialization:** Replace the `FsExecutor` backup/staging directories with Git Worktrees:
  1. `git worktree prune` (Clean up old deleted worktrees)
  2. `git worktree add .openspec-worktrees/<uuid> -b .openspec-staging-<uuid>`
  3. Generate and write all spec files/artifacts directly into the `.openspec-worktrees/<uuid>` tree.
- **Dependency Symlinking:** During worktree initialization, execute:
  1. `ln -s ../../node_modules .openspec-worktrees/<uuid>/node_modules` (or equivalent cross-platform junction on Windows)
  2. `ln -s ../../.env .openspec-worktrees/<uuid>/.env`
- **Dynamic Port Isolation:** When invoking commands like `ai-eval`, `eslint`, or `vitest` inside the worktree, the CLI MUST parse the UUID into an integer offset (e.g., modulo 1000 + 10000) and inject it into `process.env.PORT` and `process.env.FIRESTORE_EMULATOR_HOST` to prevent port collisions with the human's local server.
- **Pivot/Apply Phase:**
  1. Return to `<baseDir>`
  2. `git merge --squash .openspec-staging-<uuid>`
  3. `git worktree remove .openspec-worktrees/<uuid> --force`
  4. `git branch -D .openspec-staging-<uuid>`
- **Crash Cleanly:** Remove all implicit pre-flight auto-recovery hooks. If a crash occurs, the worktree and `.openspec-staging-<uuid>` branch remain orphaned for manual forensic review.

## 4. Polymorphic Claim Check & Boundary Verification

- **Byte Threshold:** `Buffer.byteLength(JSON.stringify(payload), 'utf8') > 100 * 1024`.
- **Payload Pinning:** Output `{"claimCheckPath": "...", "sha256": "<hash>"}` to `stdout`.
- **Read Command:** Implement `npm run openspec read-claim <id>`.
- **Boundary Verification:** In the read command, assert `path.normalize(target).startsWith(sandboxRoot + path.sep)`.

## 5. V1 to V2 Migration

- **Script:** Implement `scripts/openspec-cli/commands/migrate-legacy-specs.ts`.
- **Migration Guard:** Execute `git status --porcelain openspec/`. Fatal exit if non-empty to prevent corruption during migration.
- **Agent Halting:** In core read operations, if a legacy `.openspec.yaml` CST is detected, throw:
  `{ "error": "LEGACY_SPEC_DETECTED", "actionRequired": "HALT. Ask the human to commit changes and run npm run openspec migrate-legacy-specs manually." }`

## 6. End-to-End Workflow Shell Wrapper

- **Pipe Safety:** `detect-collisions` defaults to non-interactive; `apply` fails fast if `!process.stdout.isTTY` (unless `--force`).
- **Presenter Injection:** Inject `TerminalPresenter` locally, avoiding hardcoded ANSI/Spinners in core libs.
- **Zombie Process Killer:** Wrap the CLI in `spawn`. On Windows `SIGKILL` (Exit 137), implement process-tree teardown to kill `cmd.exe /c` orphans.

## 7. Bifurcated Testing

- **Unit Mocks:** 95% coverage on CLI fast-paths. Mock `proper-lockfile` and Git child processes.
- **E2E Isolation:** 100% intent coverage. In `beforeEach`, use an isolated `git init` directory (`.tmp/test-sandbox-${randomUUID()}`).
- **Deterministic Rollback Simulation:** Spawn the CLI, simulate a SIGKILL mid-branch creation, and assert the system safely isolates changes without corrupting the base branch tree.
- **FD Cleanup:** Tests must implement a strict `afterEach` file descriptor registry to prevent `EMFILE` runner crashes.
