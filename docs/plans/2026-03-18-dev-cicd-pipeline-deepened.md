# Deepened Plan: Modern Dev Workflow & CI/CD Pipeline

## Enhancement Summary

**Deepened on:** 2026-03-18
**Sections enhanced:** 4
**Research agents used:** `best-practices-researcher` (Pre-commit hooks), `best-practices-researcher` (GitHub Actions CI validation), `best-practices-researcher` (Commit hygiene), `explore` (OpenSpec format analysis), `best-practices-researcher` (Testing standards & Top-Tier practices)

### Key Improvements

1. **Lefthook over Husky:** Replaced traditional Husky + `lint-staged` with Lefthook for 10x faster, parallelized zero-overhead local Git hooks.
2. **Selective Testing (Pre-commit):** Avoid running the full test suite locally on every commit. Use `vitest related --run` to only test staged files, preserving developer velocity while ensuring correctness.
3. **Dynamic Matrix Sharding (CI/CD):** Instead of running Playwright/Vitest concurrently on one slow CI machine, shard tests across multiple GitHub Actions runners and merge the blob reports at the end.
4. **Conventional & Atomic Commits:** Enforced `commitlint` rules via Lefthook's `commit-msg` hook to guarantee semantic versioning and changelog compatibility, while explicitly pushing for "Atomic Commits" (no `git add .`).
5. **Modern Testing Standards (Trophy vs Pyramid):** Adopted the 2026 industry standard for testing (Kent C. Dodds' Testing Trophy) emphasizing Integration Tests over brittle Unit Tests, and utilizing Mutation Testing (Stryker) for actual test quality over vanity 100% coverage metrics.

---

## Section 1: Testing Suite Quality & Coverage Standards

Reviewing the testing suite against top-tier companies (Meta, Google) and young unicorns to establish our baseline for 2026.

### Research Insights

**Best Practices:**

- **The 100% Coverage Myth is Dead:** Top-tier companies (Google median is 78%, 75th percentile is 85%) focus on defect-catching efficiency rather than 100% line coverage. The unicorn standard is **80% branch/statement coverage on _new code_**, while allowing the overall project to float between 70-80%.
- **Test Quality over Quantity:** Code coverage only measures execution, not assertion quality. In 2026, **Mutation Testing** (e.g., Stryker Mutator) is the gold standard for high-quality suites, ensuring tests actually fail when logic is altered.
- **The Testing Trophy:** Move away from the traditional test pyramid. For a Vite/React/Playwright stack:
  1. Static Analysis (15%): TypeScript, ESLint.
  2. Unit Tests (20%): Vitest for pure functions, custom hooks, and complex utility math.
  3. Integration Tests (50%): Vitest + React Testing Library + MSW (Mock Service Worker). Render whole pages/complex components and test user interactions.
  4. E2E Tests (15%): Playwright strictly for P0/P1 "Critical User Journeys" (e.g., Login, create whiteboard, upgrade subscription). Avoid E2E for edge cases.

**Performance Considerations:**

- **Flakiness Tracking & Quarantine:** Flaky tests kill CI trust. Implement a policy: if a Playwright test is flaky, it is immediately moved to a `.skip` (Quarantine) block so it doesn't block PRs until fixed.
- **API Seeding for E2E:** Playwright tests should use API calls (e.g., `api.post('/create-user')`) to set up state instantly rather than clicking through the UI to set up test prerequisites.
- **No Hardcoded Waits:** Ban `page.waitForTimeout()` in Playwright. Always use auto-waiting locators.

**Implementation Details:**

- Integrate `Stryker` for nightly mutation testing (not on every PR, as it's computationally expensive).
- Enforce PR boundaries: PRs should never take more than 10-15 minutes to validate via aggressive parallelization.

---

## Section 2: Local Git Hooks (Pre-commit)

We need to ensure that tests and linters pass locally before code is committed to the repository.

### Research Insights

**Best Practices:**

- Use **Lefthook** instead of Husky in 2026. It is written in Go, avoids Node.js boot overhead, runs commands in parallel natively, and handles unstaged changes automatically.
- **Selective Testing:** Never run `npm test` on `pre-commit`. Always isolate the dependency graph of staged files.

**Performance Considerations:**

- Boot-Time Bottleneck: If Vitest takes >3 seconds to boot, developer velocity drops. Keep `pre-commit` restricted strictly to `vitest related` and move full type-checking (`tsc --noEmit`) to `pre-push`.

**Implementation Details (`lefthook.yml`):**

```yaml
pre-commit:
  parallel: true
  commands:
    eslint:
      glob: "*.{js,ts,jsx,tsx}"
      run: npx eslint --fix {staged_files} && git add {staged_files}
    prettier:
      glob: "*.{js,ts,jsx,tsx,json,css,md}"
      run: npx prettier --write {staged_files} && git add {staged_files}
    tests:
      glob: "*.{js,ts,jsx,tsx}"
      # Run Vitest only on staged files
      run: npx vitest related --run {staged_files}

pre-push:
  commands:
    type-check:
      run: npx tsc --noEmit
```

**Edge Cases:**

- _Emergency hotfixes:_ Developers must be educated on using `git commit --no-verify` to bypass local hooks when absolutely necessary (relying on CI as the final gate).

---

## Section 3: Commit Hygiene & Organization

All commits should be logical, correct, have clear messages, and be organized by functionality (feature, bugfix, chore, etc.).

### Research Insights

**Best Practices:**

- Adopt **Conventional Commits 1.0.0** (`feat:`, `fix:`, `chore:`, `refactor:`, etc.).
- Enforce the standard using `@commitlint/cli` and `@commitlint/config-conventional` during the `commit-msg` Git hook.
- Enforce **Atomic Commits**: One commit equals one logical change. Avoid `git add .` and use `git add -p` (patch mode) to stage specific logical blocks.

**Implementation Details (Adding to Lefthook):**

```javascript
// commitlint.config.js
export default {
  extends: ["@commitlint/config-conventional"],
};
```

```yaml
# Append to lefthook.yml
commit-msg:
  commands:
    commitlint:
      run: npx commitlint --edit {1}
```

**Common Pitfalls:**

- _Monolithic/Frankenstein Commits:_ Mixing refactors, features, and bug fixes in one commit makes `git revert` and code reviews nearly impossible. Split them chronologically.
- _Vague Messages:_ Explain _why_, not _how_. (e.g., `fix(ui): increase button padding for mobile touch targets` instead of `fix: update padding`).

---

## Section 4: CI/CD Pipeline (GitHub Actions)

A robust pipeline to validate that all tests pass before code is merged to a branch or deployed.

### Research Insights

**Best Practices:**

- **Action Pinning:** Pin third-party actions to their SHA-256 commit hashes instead of mutable tags (`@v4`) to prevent supply chain attacks.
- **Concurrency Control:** Always cancel in-progress runs when a new commit is pushed to the same PR to save CI minutes.

**Performance Considerations:**

- **Playwright Sharding:** Do not run Playwright concurrently on a single GitHub runner. Use Dynamic Matrix Sharding (`--shard=1/3`) across multiple runners, output blob reports, and merge them in a final job.
- **Vitest Isolate:** Pass `--no-isolate` to Vitest in CI to avoid recreating the V8 context for every file, dramatically speeding up unit tests.
- **Dependency Caching:** Rely on `actions/setup-node@v4` built-in `cache: 'npm'` rather than manually caching `node_modules`. Cache the Playwright binaries explicitly (`~/.cache/ms-playwright`).

**Implementation Details (`.github/workflows/ci.yml` snippet):**

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true

permissions:
  contents: read

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20.x"
          cache: "npm"
      - run: npm ci
      - run: npx vitest run --no-isolate --coverage
```

**Edge Cases:**

- _Zombie Processes:_ Playwright's `webServer` step can hang on failure. Ensure job-level timeouts (`timeout-minutes: 15`) are set in the workflow file.

---

_Ready to be converted into an OpenSpec via `/create-openspec` or implemented directly._
