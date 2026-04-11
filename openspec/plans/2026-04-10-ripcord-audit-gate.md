---
title: Ripcord Audit Gate & CLI Hardening
status: proposed
author: AI
date: 2026-04-10
dependencies: []
---

# Proposal: Ripcord Audit Gate & CLI Hardening

## Why

The current OpenSpec CLI interweaves probabilistic ML checks with deterministic, high-velocity paths, causing terminal hangs and CI/CD deadlocks. Furthermore, the underlying CLI infrastructure previously attempted to manage concurrency and staging via brittle, custom filesystem operations (shadow trees, manual mutexes, and `EXDEV` workarounds) which lead to split-brain states and extreme complexity.

We must execute the "Ripcord Action" to decouple ML checks from synchronous execution paths, while gutting the custom filesystem paradigm in favor of battle-tested OS-native locking and Git-native atomicity.

## What Changes

### 1. The Ripcord Action (ML Decoupling)

Strip non-deterministic ML execution from the core pipeline to protect the event loop.

- **Dynamic Imports:** `propose`, `apply`, `start`, `verify`, and `archive` will use dynamic imports for heavy ML libraries (e.g., `@google/genai`), ensuring they are never loaded into V8 memory during standard operations.
- **Dedicated Commands:** Move heavy ML checks to standalone commands: `openspec detect-collisions` and `openspec audit-drift`.
- **`AbortSignal` Enforcement:** All ML fetches must be tightly bound to an `AbortController` (e.g., `AbortSignal.timeout(30000)`). The timeout must wrap both the dynamic import and the execution.
- **Streaming ML Pipelines:** To prevent V8 Heap Exhaustion (OOM) and Event Loop starvation on massive payloads, ML outputs MUST be piped through `stream/promises` (`pipeline(mlStream, hashTransform, fs.createWriteStream)`). If the stream fails, the partial file must be explicitly unlinked.
- **Time-Based Event Loop Yielding:** To prevent massive cryptographic streams from starving the Mutex Heartbeat, inject an async generator into the pipeline that yields to `setImmediate` every 50ms.

### 2. OS-Native Locking

Gut the custom `mkdirSync` heartbeat locks and lock-stealing logic. Replace it with the industry-standard `proper-lockfile`.

- **Global Workspace Lock:** The CLI will utilize `proper-lockfile` on a static `.tmp/openspec.lock` file to guarantee cross-platform POSIX-compliant atomicity.
- **Stale Lock Resolution:** `proper-lockfile` natively handles stale locks via its robust `stale` configuration, completely eliminating the need for our custom lock-stealing and asynchronous EBUSY backoff loops.

### 3. Git-Native Atomicity (Isolated Worktrees)

Gut the massive "Blue-Green Filesystem Paradigm" and the blocking "Fatal Git Guard" which prevented AI workflows during dirty human experimentation. Delegate atomicity and rollbacks entirely to Git Worktrees.

- **Isolated Git Worktrees:** Instead of blocking `git checkout -b` when the user has dirty files, the `FsExecutor` will execute `git worktree add .openspec-worktrees/<uuid> -b .openspec-staging-<uuid>`. All file generations, modifications, and AI evaluations happen in this 100% isolated directory.
- **Automated Dependency Symlinking:** To ensure validators (`ai-eval`, `eslint`, `vitest`) run seamlessly inside the worktree without duplicating massive folders, the CLI will natively symlink `node_modules/` and `.env` from the root workspace into `.openspec-worktrees/<uuid>`.
- **Dynamic Port Isolation (Socratic Resolution):** To prevent port and database collisions when the AI runs tests in the worktree while the human is actively coding in the main tree, the OpenSpec CLI MUST execute all worktree validations with a dynamically injected `PORT` and `FIRESTORE_EMULATOR_HOST` (e.g., offsetting ports by `+1000` based on the UUID hash) to guarantee network isolation.
- **Native Dirty Merge Protection (Pivot/Apply):** To apply the staging area, the CLI executes a seamless Git swap from the main directory: `git merge --squash .openspec-staging-<uuid>`. This relies on Git's native intelligence to protect the user's uncommitted files, failing safely if there are true conflicts, without needing a rigid "Fatal Git Guard" pre-flight block.
- **Fail-Fast Crash Cleanly Paradigm:** We explicitly reject mid-flight auto-recovery ledgers. If the CLI fails or receives a `SIGINT` mid-generation, it crashes cleanly.
  - The worktree and branch are intentionally orphaned as forensic artifacts.
  - Rollbacks are trivial: `git worktree remove .openspec-worktrees/<uuid> --force` and delete the branch.
  - On every CLI boot, the system MUST run `git worktree prune` to clean up orphaned folders if the user manually deleted the branch.
- **Polymorphic Cryptographic Pinning:** Use the Claim Check pattern for JSON payloads >100KB to bypass command-line length limits.
  - The CLI must implement a polymorphic interface: for local execution, it retains `.tmp/payloads.json` so local AI agents can natively read them. For distributed Cloud Run workflows, it offloads to Firestore (`{ "claimCheckId": "doc-123" }`).
  - Pin payloads using SHA-256 (`{ "claimCheckPath": "...", "sha256": "<hash>" }`).
- **Claim Check Boundary Validation:** Downstream agents must strictly validate `normalizedPath === sandboxRoot || normalizedPath.startsWith(sandboxRoot + path.sep)` to prevent Path Traversal Arbitrary File Read exploits.

### 4. V1 to V2 Migration Strategy (Hard Cutover)

The transition from legacy global `.openspec.yaml` CST tracking to feature-scoped `.audit_receipt.json` files requires explicit human intervention.

- **Zod Transform Schema:** Old V1 staging tokens are dynamically upgraded to V2 in memory (no disk I/O for tokens) using Zod Discriminated Unions.
- **Dedicated Migration Script:** No JIT migration hidden in standard commands. A dedicated `npm run openspec migrate-legacy-specs` command handles AST parsing and file generation.
- **Strict Git Guard:** The migration script **MUST fatally exit** if `git status --porcelain openspec/` shows uncommitted changes to prevent silent data loss. The `--force` flag bypasses interactive prompts, but NEVER bypasses this Git tree check.
- **In-Flight Spec Protection:** The migration script must explicitly ignore any features not marked as `status: archived`. Modifying in-flight features breaks their active Staging Tokens' cryptographic hashes.

### 5. End-to-End Workflow & Presentation Layer

- **Bifurcated Pipe Safety:** Explicit flags (`--non-interactive`, `CI=true`) override `isTTY`. If no explicit flags are present and `!process.stdout.isTTY`:
  - _Audit/Read Commands_ (e.g., `detect-collisions`) MUST pipe cleanly and default to non-interactive mode to prevent breaking standard Unix pipes (e.g., `command | jq`).
  - _Mutative Commands_ (e.g., `apply`, `start`, `archive`) MUST fail fast with a non-zero exit code ("TTY required for interactive prompt") unless explicitly forced via `--force`, preventing destructive auto-execution.
- **Presenter Abstraction (Dependency Injection):** The CLI must not hardcode `TerminalPresenter` (which emits ANSI codes and spinners) into core libraries. The architecture must enforce dependency injection, passing `TerminalPresenter` locally but injecting a `CloudLogPresenter` or `WebhookPresenter` when executing remotely.
- **Strict Presenter Pattern & IDE Mismatch:** In `--json` mode, `stdout` is pristine. The CLI remains silent on `stderr` and ONLY emits the final Claim Check object to `stdout`.
- **Internalized "Halt & Update":** The `start --auto-fix --stage` command encapsulates `validate` and `ai-eval` internally.
- **Structured Error Feedback:** If an internal validation fails, a non-zero exit in `--json` mode MUST still emit a valid JSON pointer to `stdout` ensuring agents can read critiques.
- **Zero-Trust Claim Checks:** The parent orchestrator NEVER trusts paths emitted by the child. The parent dictates the UUID payload path via `ENV` and hardcodes the read.

### 6. Bifurcated Testing Architecture

The CLI must hit 100% test coverage across `scripts/openspec-cli/` and associated rules/skills, verified via unified `c8` V8 coverage merging Vitest and E2E processes.

- **Functional Core Suite (`*.test.ts`):** 95% Coverage. Mocks allowed.
- **E2E Intent Validation Suite (`*.e2e.test.ts` / standalone Node scripts):** 100% Intent Coverage. NO Mocks.
  - **Dependency Injected Isolation:** The CLI must accept a `baseDir` injection. Tests must execute in strictly isolated Git sandboxes (`git init`) to prevent cross-talk.
  - **FD Cleanup:** Tests must implement a strict `afterEach` file descriptor registry to prevent `EMFILE` runner crashes.
  - **Deterministic Rollback Simulation:** A standalone script must spawn the CLI, simulating a SIGKILL mid-branch creation, and assert the system safely errors on the next boot due to the orphaned staging branch.

## Impact

- **Codebase:** Massive deletion of bespoke `FsExecutor` code. ML logic moves to standalone commands.
- **Safety:** The workspace leverages battle-tested Git internals for atomicity, eradicating `EXDEV`, symlink traversal vectors, and split-brain failures.
- **Velocity:** TDD loops are no longer blocked by probabilistic ML checks or asynchronous lock backoffs.
