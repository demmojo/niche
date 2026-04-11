# OpenSpec Plan: CLI Robustness Hardening

## 1. Context & Objective

The OpenSpec CLI currently suffers from several structural vulnerabilities during edge-case executions, including orphaned Git worktrees, metadata data loss during legacy migrations, brittle handling of empty commits, unhandled `EPIPE` exceptions in piped CI environments, and dependency resolution conflicts caused by `node_modules` symlinking. This plan resolves these issues by implementing transactional ledger backups, index-aware git validation, and strict isolation boundaries.

## 2. Relationships

- **extends:** `ripcord-audit-gate-cli-hardening`
- **status:** draft

## 3. Design & Architecture

### 3.1 Worktree Teardown & EBUSY Abandonment

Instead of relying on `fs.rmSync` followed by `git worktree prune`, the CLI will use Git's native `git worktree remove <path> --force`. Because background daemons (e.g., TS Server, ESLint) often lock files inside the worktree (triggering `EBUSY` or `EPERM` on Windows/macOS), the teardown sequence will silently catch these specific errors. If an `EBUSY` lock is encountered, the CLI will abandon the directory, logging a non-fatal warning, ensuring the execution loop completes instantly without blocking the user or crashing the process on OS-level locks.

### 3.2 FsExecutor Synchronous Ledger & Deterministic CI Bypasses

To prevent split-brain states during metadata migrations or file staging, the `FsExecutor` will implement an Application Ledger. Before any mutative write, original files will be synchronously backed up to a transient ledger instance. The execution loop will be wrapped in a `try/catch`. On failure, the ledger is reverse-iterated and restored synchronously.

Crucially, the scope of the `FsExecutor` Ledger is strictly limited to the **Apply phase** (as Git worktrees inherently serve as the ledger during the staging phase). In headless environments (detected via `process.env.CI`), the CLI will bypass automatic rollbacks and interactive recovery, opting to fail hard and freeze the ledger state. To ensure deterministic CI artifact inspection and debugging, the frozen ledger will be dumped to a predictable `.openspec-ledger-dump/` directory within the local workspace (rather than `os.tmpdir()`, which is ephemeral in CI runners).

### 3.3 Process Lifecycle & Terminal Isolation

Trapping `SIGINT` (Ctrl+C) for heavy synchronous file I/O rollbacks frustrates users and escalates to untrappable `SIGKILL`s. The CLI will **not** trap termination signals for rollbacks. It will let the process die instantly and rely entirely on the explicit `openspec recover` workflow. The CLI will globally attach `EPIPE` swallow handlers to `process.stdout` and `process.stderr` to prevent downstream pipe closures (e.g., `openspec ... | jq`) from crashing the process.

To protect against downstream webhook limits crashing due to massive diffs, the CLI will route all output through a `TerminalPresenter`. This presenter will strictly enforce that all human-readable logs route to `stderr`, reserving `stdout` exclusively for valid JSON payloads. "Claim Check" payloads (writing output to a file and emitting `{ "claimCheckPath": "..." }`) will **only** be triggered if the caller explicitly opts-in via the `--claim-check-dir=<path>` flag, preserving the JSON schema contract.

### 3.4 Strict Dependency Boundary (No Symlinking)

Monolithic or shallow symlinking of `node_modules` into worktrees poses severe risks of root-workspace corruption via NPM traversal and "Invalid Hook Call" singleton duplications. The `node_modules` symlink and any reliance on `NODE_PATH` injection will be completely eradicated.

Instead, the CLI will execute `npm ci --no-audit --no-fund` within isolated worktrees to securely hydrate dependencies. The `--prefer-offline` flag is explicitly omitted due to upstream npm resolution bugs that cause intermittent cache invalidation failures.

### 3.5 Ephemeral State & Explicit Recovery (Lockfile GC)

To prevent silent disk exhaustion from hard crashes, the CLI will implement a defensive "Boot-Time Garbage Collection" sweep. All transient staging environments and ledgers will be migrated to the OS-level `os.tmpdir()` boundary. To prevent PID-reuse collisions in Docker, liveness checks will use an active lockfile (heartbeat) or UUID rather than relying on OS PIDs.

If the GC detects an orphaned directory containing an unresolved application ledger, the CLI will explicitly block execution, prevent pruning, and demand the user run a new `openspec recover` command. To prevent concurrent "thundering herd" crashes in matrix CI pipelines, the recursive deletion routine will explicitly swallow `ENOENT` and `ENOTEMPTY` exceptions.

### 3.6 Strict Drift Detection & TOCTOU Prevention

To prevent Time-of-Check to Time-of-Use (TOCTOU) race conditions where files are modified between the `--stage` and `--apply` phases, the CLI will rely on cryptographic SHA-256 staging tokens rather than Git index mechanics (which are blind to human workspace edits made _before_ staging). Before executing the `--apply` command, the CLI will recalculate the target files' hashes and strictly verify them against the token.

### 3.7 Index-Aware Commit Gates

Relying on standard `git status --porcelain` mixes untracked and staged file states. The CLI will strictly use `git diff --cached --quiet` to determine if the _index_ is dirty before executing `git commit`, failing gracefully if empty.

To ensure commit hygiene without sacrificing performance or triggering interactive hooks, the CLI will execute `git commit --no-verify`. Code quality validation (`npm run lint` or `typecheck`) will be intentionally deferred to the CI pipeline to prevent bespoke local hooks and project-context compiler failures from breaking the core OpenSpec atomic commit workflow.

Furthermore, when extracting modified or untracked paths, the CLI will execute `git status --porcelain -z` and explicitly parse the UTF-8 output via `.split('\0')`. This strict null-terminated extraction guarantees deterministic parsing of edge-case filenames containing spaces or shell-escaped quotes.

## 4. Execution Tasks

### Phase 1: Test Scaffolding

- [ ] **Task 1.1**: Write `fs-intents.test.ts` to assert that `FsExecutor` restores files from the `os.tmpdir()` ledger upon synthetic failure.
- [ ] **Task 1.2**: Write tests in `stage.test.ts` to assert `git diff --cached --quiet` accurately bypasses empty commits, and verify `git commit --no-verify` interacts correctly with pre-commit `npm run lint`/`typecheck` scripts.
- [ ] **Task 1.3**: Write an `EPIPE` mock test asserting that global handlers suppress traces and trigger graceful shutdowns.
- [ ] **Task 1.4**: Write tests for TOCTOU drift detection to verify the `--apply` command rejects invalid SHA-256 staging tokens.

### Phase 2: Application Ledger & Explicit Recovery Implementation

- [ ] **Task 2.1**: Update `FsExecutor.ts` to implement the synchronous OS-level ledger backup sequence before mutations.
- [ ] **Task 2.2**: Implement the `catch` block reverse-iteration and synchronous restore logic (`fs.copyFileSync`) in `FsExecutor.execute`.
- [ ] **Task 2.3**: Inject `process.env.CI` conditional logic into `FsExecutor` to bypass rollbacks, fail hard, and dump the frozen state to a local `.openspec-ledger-dump/` directory for CI artifact collection.
- [ ] **Task 2.4**: Implement the `openspec recover` command and update the Boot-Time GC to block execution if an unresolved ledger is detected for a dead PID.

### Phase 3: Global Terminal Boundary & Payload Resiliency

- [ ] **Task 3.1**: Modify the CLI entrypoint to bind `.on('error')` handlers to `process.stdout` and `process.stderr` that specifically swallow `EPIPE` errors.
- [ ] **Task 3.2**: Replace all internal `process.exit()` calls with structured errors so the CLI entry wrapper can handle process termination cleanly.
- [ ] **Task 3.3**: Implement `TerminalPresenter` to enforce `stderr` logging and `stdout` JSON emission, including the explicit `--claim-check-dir=<path>` flag fallback.

### Phase 4: Staging Isolation & Git Hygiene

- [ ] **Task 4.1**: Refactor `stage.ts` to replace symlinking with `npm ci --no-audit --no-fund` in isolated worktrees.
- [ ] **Task 4.2**: Inject `git diff --cached --quiet` checks prior to `git commit`, explicitly relying on `git commit --no-verify` to bypass local hooks and defer linting to CI pipelines.
- [ ] **Task 4.3**: Refactor `git status` extraction pipelines to strictly enforce `--porcelain -z` and `.split('\0')` buffer parsing.
- [ ] **Task 4.4**: Update `cleanupOldStaged` to use `git worktree remove <path> --force`, silently abandoning the directory on `EBUSY` or `EPERM` locks to prevent escalating crashes.
- [ ] **Task 4.5**: Migrate all transient directory allocations to `os.tmpdir()` using an active lockfile naming scheme (`proper-lockfile`), implementing the liveness-based boot GC sweep.
- [ ] **Task 4.6**: Implement SHA-256 (`git hash-object`) cryptographic hashing in the staging phase to embed in the staging token, verifying it in the apply phase to prevent TOCTOU races.
- [ ] **Task 4.7**: Ensure `.npmrc` files are aggressively stripped/ignored before executing `git add .` to prevent auth token leakage or commit pollution.
