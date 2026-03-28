## Context

As the project grows, maintaining code quality and repository health is paramount. We need automated systems to ensure testing standards are met and git history remains clean. 2026 industry standards lean heavily toward tools like Lefthook (over Husky) and matrix-sharded GitHub Actions for speed.

## Goals / Non-Goals

**Goals:**

- Implement Lefthook for `pre-commit` (formatting, linting, related tests) and `commit-msg` (commitlint).
- Enforce the Conventional Commits 1.0.0 specification.
- Setup a highly optimized GitHub Actions workflow with concurrent cancellation, parallel Playwright sharding, and caching.
- Shift the testing culture from a monolithic "100% coverage" goal to a pragmatic "Testing Trophy" strategy with >80% coverage enforced on new code.

**Non-Goals:**

- We are not implementing CD (Continuous Deployment/Delivery) right now. This is purely CI (Continuous Integration) validation.
- We will not immediately integrate Stryker (Mutation Testing) into the core workflow, but the architecture will support it later as a nightly task.

## Decisions

**1. Lefthook instead of Husky**

- **Decision**: Adopt Lefthook.
- **Rationale**: Written in Go, it eliminates Node.js startup overhead and can run linting, formatting, and tests in parallel, saving precious developer time.
- **Alternatives Considered**:
  - _Husky + lint-staged_: The legacy standard. Slower and requires multiple packages. Rejected in favor of the modern unified Lefthook.

**2. Selective Testing on Pre-commit**

- **Decision**: Only run `vitest related --run {staged_files}` during pre-commit.
- **Rationale**: Running the entire test suite on every commit destroys developer velocity. Selective testing ensures only potentially impacted code is tested. Full suite and `tsc --noEmit` are reserved for CI and optionally `pre-push`.

**3. Playwright Sharding in CI**

- **Decision**: Use GitHub Actions matrix strategy to shard Playwright tests across multiple runners, then merge the blob reports.
- **Rationale**: E2E tests are notoriously slow. Running them sequentially on one runner is a bottleneck. Sharding provides horizontal scaling.

## Risks / Trade-offs

- **Risk: Developer Friction** -> Strict commit message rules and local test requirements can initially frustrate developers accustomed to `git commit -m "wip"`.
- **Mitigation**: Provide clear documentation and setup instructions for tools like Commitizen (`git cz`) that interactive guide developers through the commit process. Encourage `git commit --no-verify` _only_ for emergency hotfixes.
