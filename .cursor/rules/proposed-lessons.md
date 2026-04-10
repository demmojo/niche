# Extracted Learnings: dev-in-the-loop-refactor

## Context

Implemented the "Developer-in-the-loop" dual-mode execution architecture for the OpenSpec CLI to prevent AI agents from bypassing human review while keeping CI/CD functional.

## Product-Engineering Principles

### 1. Zero-Anxiety AI Execution (Fail-Safe Rollbacks)

- **Friction**: Sequentially applying files with `fs.cpSync` is not atomic. A crash midway leaves the repository in a corrupted split-brain state, destroying trust.
- **Resolution**: Implemented an **Application Ledger**. Before any writes, the CLI backups targeted files to a `.tmp/.../backup/` directory. If an `EBUSY` error or crash occurs during `fs.cpSync`, the `catch` block iterates the ledger to rollback all files to their original state.
- **Strategic Impact**: AI tooling is inherently non-deterministic. The Application Ledger is the fundamental safety net that gives developers the confidence to let an AI mutate their codebase without fear of catastrophic regressions.

### 2. Preserving Headless Reliability & Shared Contexts

- **Friction**: `process.exit(1)` truncates buffers in CLI mode, but calling _any_ exit function from deep within a library poisons it for use inside a persistent web server (like Express/Cloud Run), causing the entire server to crash.
- **Resolution**: Replaced raw `process.exit` with a `safeExit` wrapper at the **outermost CLI entrypoint only**. Internal modules (like `FsExecutor`) strictly throw `FsIntentError` objects. Additionally, implemented the **Claim Check Pattern**: if a JSON `stdout` payload exceeds 100KB, the CLI writes it to disk and emits a path reference to prevent blowing up downstream memory limits.
- **Strategic Impact**: Decoupling process termination from business logic ensures the OpenSpec core remains portable across CLI and persistent server environments without catastrophic side-effects.

### 2b. The "Stale Token" TOCTOU Collision

- **Friction**: The staging phase pauses for human approval, opening a wide window where target files might be modified by other agents or developers before the `apply` phase executes.
- **Resolution**: The Staging Token must encode the SHA-256 hashes of the target files at the moment of staging. The `apply` phase re-hashes the targets and aborts if they drifted, enforcing a strict TOCTOU safety guarantee.

### 3. Meet the User in Their Flow (Anti-Fatigue UX)

- **Friction**: Diffs were hard to review in terminal, leading to "approval fatigue" and rubber-stamping.
- **Resolution**: Replaced raw `.diff` patches with dynamic IDE Diff URIs (`vscode://vscode.diff/...`) for native side-by-side review in Cursor.
- **Strategic Impact**: Security gates that demand high cognitive load result in blind approvals. By integrating the review process directly into the developer's existing workflow, we ensure actual oversight and reduce friction.

### 4. Intent-Based Testing & Concurrency Safety

- **Friction**: 95% line coverage on a CLI with heavy filesystem mutations leads to brittle, mock-heavy tests. Furthermore, running E2E filesystem tests in Vitest's concurrent environment causes race conditions if they share a `.tmp` directory.
- **Resolution**: Adopted a **Bifurcated Testing Architecture**:
  - _Functional Core_: Unit tests with 95% line coverage on parsers, validators, and intents using mocks.
  - _Intent Validation_: E2E filesystem integration tests without `fs` mocks. Each test injects a unique, UUID-based sandbox directory to guarantee absolute isolation during parallel test execution.
- **Strategic Impact**: True E2E tests build confidence, but only if they are deterministic. Unique sandbox generation eliminates flaky CI runs caused by concurrent filesystem collisions.

### 5. The Strict Trust Boundary

- **Friction**: `mtime` was too brittle for TOCTOU due to IDE auto-formats, and `FsExecutor` might process a relative path `../../file` that escapes the `.tmp` sandbox.
- **Resolution**: `getSandboxPath` method resolves absolute paths and enforces that they must exist within the sandbox root. Used SHA-256 content hashing to strictly prevent TOCTOU on target files instead of `mtime`.
- **Strategic Impact**: The primary value proposition of 'developer-in-the-loop' collapses if an agent can execute writes outside the staging boundary. Strict path bounding and state hashing is the foundational contract that makes the tool safe to use.
