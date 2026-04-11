# Tasks

## Phase 1: ML Decoupling & Pipeline Safety

- [x] Remove static imports for GenAI/ML libraries across the CLI.
- [x] Implement standalone `detect-collisions` and `audit-drift` commands using dynamic imports.
- [x] Implement `AbortSignal` timeout wrappers for all external ML fetches.
- [x] Build `MarkdownExtractorTransform` for stream pipelines.
- [x] Create async generator utility to yield `setImmediate` every 50ms during large crypto/ML streams.

## Phase 2: Workspace Locking

- [x] Add `proper-lockfile` to dependencies.
- [x] Implement global lock bootstrap logic (`mkdirSync('.tmp', recursive)`, `writeFileSync('.tmp/openspec.lock')`).
- [x] Integrate `proper-lockfile` into main orchestrator execution flow and drop legacy lock-stealing logic.

## Phase 3: Git-Native Sandboxing

- [x] Replace `FsExecutor` with Git Worktree commands (`worktree add`, UUID generation).
- [x] Implement automated filesystem symlinking for `node_modules` and `.env` inside isolated worktrees.
- [x] Implement dynamic port resolution/shifting logic for Worktree environment variables.
- [x] Build squash/apply operations from the main branch.
- [x] Create cleanup routine: execute `git worktree prune` and orphaned branch sweep on CLI init.
- [x] Implement Polymorphic Claim Check pattern logic (sha256 hashing, path validation against path traversal).

## Phase 4: Migration & Presentation Layer

- [ ] Build `migrate-legacy-specs` script with strict `git status --porcelain` validation guard.
- [ ] Add Zod Transform schemas for parsing and upgrading V1 to V2 tokens in memory.
- [ ] Build logic to ignore active/in-flight specs during migration.
- [ ] Extract UI elements via Dependency Injection (`TerminalPresenter`, `CloudLogPresenter`).
- [ ] Implement strict `--json` stdout enforcement (bifurcated pipe safety via `isTTY`).

## Phase 5: Testing

- [ ] Write 95% coverage functional tests (`*.test.ts`) for utility changes.
- [ ] Write mock-free E2E tests executing isolated sandboxes (`git init`) via Dependency Injected `baseDir`.
- [ ] Implement `afterEach` test fixture file descriptor cleanup to prevent `EMFILE` errors.
- [ ] Build deterministic mid-generation `SIGKILL` simulation script to test Git branch rollback stability.
