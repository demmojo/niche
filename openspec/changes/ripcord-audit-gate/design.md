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

## 3. Git-Native Atomicity & Fail-Fast Staging

- **Atomic Branch Swaps:** All file generation and modification logic is isolated onto a Git branch (`git checkout -b .openspec-staging-<uuid>`).
- **Pivot/Apply:** The staging area is applied via a seamless Git swap: `git checkout <base-branch> && git merge --squash .openspec-staging-<uuid>`.
- **Fatal Git Guard (Dirty Tree Protection):** Before initiating the staging branch swap, the CLI MUST run `git status --porcelain`. If there are any uncommitted changes in the workspace, the CLI MUST fatally exit (Exit Code 1). Auto-stash/pop is explicitly forbidden to prevent silent corruption.
- **Crash Cleanly Paradigm:** Mid-flight auto-recovery ledgers are forbidden. A `SIGINT` mid-generation causes a clean crash. The `.openspec-staging-<uuid>` branch is orphaned as a forensic artifact, and rollbacks are accomplished natively by deleting the branch.

## 4. Forensic Artifact Management & Anti-Hijack

- **Git State Hygiene:** Anti-bloat measures involve cleaning up orphaned `.openspec-staging-*` branches rather than complex symlink and directory regex checks.
- **Anti-Hijack Defense:** Strict reliance on Git internals entirely mitigates the directory traversal and symlink hijack vulnerabilities present in filesystem-based staging.

## 5. Polymorphic Cryptographic Pinning (Claim Check)

- Payload sizes >100KB are diverted to polymorphic Claim Checks (file or Firestore) pinned via SHA-256. Downstream agents retrieve via `npm run openspec read-claim <id>` with strict boundary validation (`startsWith(sandboxRoot)`).

## 6. V1 to V2 Migration Strategy

- V1 to V2 cutover uses a dedicated `npm run openspec migrate-legacy-specs` command. It strictly guards against dirty git trees using the Fatal Git Guard and throws an Agent Halting Payload (`LEGACY_SPEC_DETECTED`) if it encounters V1 specs.

## 7. Bifurcated Testing Architecture

- **Functional Core (Unit):** 95%+ coverage, heavily isolating Git commands and `proper-lockfile` abstractions.
- **E2E Intent Validation:** 100% coverage, executing in isolated `git init` sandboxes to strictly avoid cross-talk. Includes deterministic rollback simulation by asserting clean failures on orphaned staging branches.
