# Developer Workflow & CI/CD Pipeline

The goal is to align the project's development workflow and CI/CD pipelines with top-tier 2026 industry standards (e.g., Google, Meta, Unicorns), ensuring high code quality, robust testing, and clean commit history.

## Features

### 1. Local Pre-commit Hooks (Lefthook)

- **Requirement:** `lefthook` must be installed and configured via `lefthook.yml`.
- **Requirement:** The `pre-commit` hook must run `eslint`, `prettier`, and `vitest related` in parallel against staged files only.
- **Requirement:** The `commit-msg` hook must run `commitlint` to enforce Conventional Commits.

### 2. Commit Hygiene (Commitlint)

- **Requirement:** `@commitlint/cli` and `@commitlint/config-conventional` must be installed.
- **Requirement:** `commitlint.config.js` or equivalent must be configured to use the conventional preset.
- **Requirement:** Developers should be instructed/enabled to use Atomic Commits (one logical change per commit).

### 3. GitHub Actions CI Pipeline

- **Requirement:** A workflow file (e.g., `.github/workflows/ci.yml`) must be created.
- **Requirement:** The workflow must run on `push` and `pull_request` to `master`/`main`.
- **Requirement:** Concurrency must be configured to cancel outdated, in-progress runs for the same PR.
- **Requirement:** The Unit Test job must run `vitest` with `--no-isolate` and `--coverage` (ensuring >80% coverage on new code/overall).
- **Requirement:** The E2E job must use a matrix strategy to shard Playwright tests (e.g., 3 shards), generate blob reports, and merge them in a final job.
- **Requirement:** Proper caching must be utilized for `node_modules` (via `actions/setup-node`) and Playwright binaries (`~/.cache/ms-playwright`).

## Scenarios

- **WHEN** a developer stages files and runs `git commit -m "update"`, **THEN** the commit is blocked by the `commit-msg` hook because it does not follow Conventional Commits format (e.g., `feat: ...`, `fix: ...`).
- **WHEN** a developer writes a proper commit message but the staged files have failing related tests, **THEN** the `pre-commit` hook blocks the commit.
- **WHEN** a PR is opened, **THEN** GitHub Actions spins up the Unit Test job and 3 parallel Playwright shard jobs.
- **WHEN** all shards complete, **THEN** the `merge-reports` job generates a unified HTML report.
