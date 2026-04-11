# Proposal: Ripcord Audit Gate & CLI Hardening

## Why

The current OpenSpec CLI interweaves probabilistic ML checks with deterministic, high-velocity paths, causing terminal hangs and CI/CD deadlocks. Furthermore, the underlying CLI infrastructure previously attempted to manage concurrency and staging via brittle, custom filesystem operations (shadow trees, manual mutexes, and `EXDEV` workarounds) which lead to split-brain states and extreme complexity. We must execute the "Ripcord Action" to decouple ML checks from synchronous execution paths, while gutting the custom filesystem paradigm in favor of battle-tested OS-native locking and Git-native atomicity.

## What Changes

1. **The Ripcord Action (ML Decoupling)**: Moving heavy ML checks to standalone dynamic-imported commands (`detect-collisions`, `audit-drift`), strictly binding them to `AbortSignal`, and enforcing streaming implementations to protect the V8 Event Loop.
2. **OS-Native Locking**: Replacing custom `mkdirSync` heartbeat locks with `proper-lockfile` for global POSIX-compliant workspace locking.
3. **Git-Native Atomicity**: Replacing the "Blue-Green Filesystem Paradigm" with isolated Git worktrees (`git worktree add`). Symlinking massive folders like `node_modules` inside worktrees and dynamically injecting isolated networking ports.
4. **V1 to V2 Migration**: A hard-cutover script `migrate-legacy-specs` for parsing and upgrading feature-scoped ASTs with strict dirty Git checks.
5. **Bifurcated Presentation & Testing**: Dependency Injection for terminal/cloud presenters, pure `--json` standard output for Claim Checks, and strict intent-coverage without mocks for E2E suites.

## Capabilities

- Safely run automated validation inside isolated Git sandboxes without blocking the human developer.
- Process enormous ML outputs efficiently without V8 OOM errors using `stream/promises` and yielding.
- Manage inter-process workspace contention using standard OS lockfiles, effectively ending stale/stuck mutex loops.

## Impact

- **Codebase**: Massive deletion of bespoke `FsExecutor` code. Clean, modularized ML paths.
- **Safety**: Complete eradication of `EXDEV` errors, symlink traversal attacks, and mid-flight destructive ledger recovery vectors.
- **Velocity**: Fast TDD loops unobstructed by probabilistic checks.
