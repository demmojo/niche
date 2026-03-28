## Why

Currently, the project lacks automated enforcement of testing and commit message hygiene. Code can be pushed with failing tests, and monolithic commits with vague messages ("fix", "updates") degrade the repository's history. We need to elevate the project to top-tier 2026 industry standards (Meta, Google, unicorns) by establishing a robust, performant CI/CD and developer workflow pipeline.

## What Changes

1. **Lefthook over Husky:** Implementing `lefthook` for parallelized, high-performance local git hooks.
2. **Pre-commit Test Hooks:** Selectively running `vitest related` and linters on staged files only.
3. **Commitlint & Conventional Commits:** Enforcing structured, semantic commit messages via interactive tools (`commitizen` / `commitlint`).
4. **GitHub Actions CI/CD:** A robust, dynamic matrix-sharded pipeline for parallelized Playwright and Vitest validation before code is merged.
5. **Modern Testing Culture:** Adjusting test priorities to match the "Testing Trophy" and focusing on >80% coverage on new code rather than global 100% metrics.

## Capabilities

### New Capabilities

- `local-pre-commit-hooks`: Blocks invalid commits and selectively tests code.
- `commit-message-linting`: Enforces Conventional Commits standards.
- `ci-cd-validation`: A comprehensive, highly parallelized GitHub Actions workflow to validate PRs and main branches.
- `mutation-testing-ready`: Paving the way for future `Stryker` integration for true test quality measurement.

## Impact

- **Developer Workflow:** Developers will be guided (and enforced) to write structured commit messages and ensure tests pass locally before pushing.
- **Repository Health:** The commit history will become clean, readable, and machine-parsable (for automatic changelogs). CI times will be minimized via sharding.
- **Dependencies:** Addition of `lefthook`, `@commitlint/cli`, `@commitlint/config-conventional`.
