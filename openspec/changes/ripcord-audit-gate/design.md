# Design: Ripcord Audit Gate & CLI Hardening

## Architectural Context

The OpenSpec CLI currently suffers from CI/CD deadlocks, terminal hangs, and filesystem corruption (split-brain) due to non-deterministic ML execution coupled with high-velocity paths, and fragile filesystem ledgering. The "Ripcord Action" decouples ML checks and fortifies the CLI with OS-Native Locking (`proper-lockfile`) and Git-Native Atomicity.

## 1. The Ripcord Action (ML Decoupling)

- **Segregation & Dynamic Imports:** `propose`, `apply`, `start`, `verify`, and `archive` will strictly decouple ML. Heavy ML libraries (e.g., `@google/genai`) are dynamically imported exclusively in dedicated commands (`detect-collisions`, `audit-drift`).
- **Stream/Promise Yielding:** Massive ML pipelines must pipe via `stream/promises` and yield to the event loop (`setImmediate`) every 50ms to prevent V8 Heap Exhaustion.
- **Circuit Breaker:** All ML fetches MUST be bound to `AbortSignal.timeout(30000)`.

## 2. OS-Native Locking

- **Global Workspace Lock:** Cross-process POSIX-compliant atomicity is achieved by utilizing the industry-standard `proper-lockfile` on a static `.tmp/openspec.lock` file.
- **Stale Lock Resolution:** The CLI relies entirely on `proper-lockfile`'s native `stale` configuration for stale lock resolution, eliminating custom backoff loops and async EBUSY heartbeat mechanisms.

## 3. Git-Native Atomicity (Isolated Worktrees)

- **Isolated Git Worktrees:** All file generation, modification, and AI validation logic is completely isolated into a dedicated Git Worktree (`git worktree add .openspec-worktrees/<uuid> -b .openspec-staging-<uuid>`), eliminating the need to block workflows when the user has dirty files.
- **Automated Dependency Symlinking:** Natively symlink `node_modules/` and `.env` from the root workspace into the worktree so tests and linters execute seamlessly without costly duplication. To **Mitigate NPM Symlink Destruction**, the CLI/Agent must NEVER run `npm install` inside the worktree if `node_modules` is symlinked. If an OpenSpec validation requires installing a new dependency, the CLI must run it in the main tree so the symlink propagates it.
- **Dynamic Port Isolation (Socratic Resolution):** CLI validation steps inside the worktree are injected with a dynamically computed `PORT` and `FIRESTORE_EMULATOR_HOST` (e.g., base port + 1000 based on UUID hash) to ensure AI tests never collide with the human's active local development server.
- **Pivot/Apply:** The staging area is applied via a seamless Git swap from the main directory: `git merge --squash .openspec-staging-<uuid>`. Git's native intelligence handles uncommitted file protection without a rigid pre-flight block.
- **Crash Cleanly Paradigm:** Mid-flight auto-recovery ledgers are forbidden. A `SIGINT` mid-generation causes a clean crash. The worktree and branch are orphaned as a forensic artifact, and rollbacks are accomplished natively by running `git worktree remove --force` and deleting the branch.

## 4. Forensic Artifact Management & Anti-Hijack

- **Git State Hygiene:** Anti-bloat measures involve cleaning up orphaned `.openspec-staging-*` branches and running `git worktree prune` on CLI boot to clean up deleted worktrees, rather than complex symlink and directory regex checks. Specifically, implement an **Orphaned Branch Cleanup Routine**: after running `git worktree prune`, run a sweep to delete any `.openspec-staging-*` branches that no longer have an active worktree.
- **Anti-Hijack Defense:** Strict reliance on Git internals entirely mitigates the directory traversal and symlink hijack vulnerabilities present in filesystem-based staging.

## 5. Polymorphic Cryptographic Pinning (Claim Check)

- Payload sizes >100KB are diverted to polymorphic Claim Checks (file or Firestore) pinned via SHA-256. Downstream agents retrieve via `npm run openspec read-claim <id>` with strict boundary validation (`startsWith(sandboxRoot)`).

## 6. V1 to V2 Migration Strategy

- V1 to V2 cutover uses a dedicated `npm run openspec migrate-legacy-specs` command. It strictly guards against uncommitted `openspec/` changes to prevent migration corruption, and throws an Agent Halting Payload (`LEGACY_SPEC_DETECTED`) if it encounters V1 specs during normal operation.

## 7. Bifurcated Testing Architecture

- **Functional Core (Unit):** 95%+ coverage, heavily isolating Git commands and `proper-lockfile` abstractions.
- **E2E Intent Validation:** 100% coverage, executing in isolated `git init` sandboxes to strictly avoid cross-talk. Includes deterministic rollback simulation by asserting clean failures on orphaned staging branches.
