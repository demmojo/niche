## 1. Setup Commit Hygiene & Local Hooks

- [x] 1.1 Install `lefthook`, `@commitlint/cli`, and `@commitlint/config-conventional` as dev dependencies.
- [x] 1.2 Create `commitlint.config.js` and configure the conventional preset.
- [x] 1.3 Create `lefthook.yml` with `pre-commit` (parallel linters/tests on `{staged_files}`) and `commit-msg` (commitlint) configurations.
- [x] 1.4 Initialize lefthook (e.g., `npx lefthook install`).

## 2. Implement CI/CD Pipeline (GitHub Actions)

- [x] 2.1 Create the directory `.github/workflows/`.
- [x] 2.2 Create `ci.yml` defining the workflow triggers (`push`, `pull_request`) and concurrency cancellation.
- [x] 2.3 Implement the `unit-tests` job in `ci.yml` with node setup, npm caching, and `npx vitest run --no-isolate --coverage`.
- [x] 2.4 Implement the `e2e-tests` job in `ci.yml` using a matrix strategy for Playwright sharding, binary caching, and blob report upload.
- [x] 2.5 Implement the `merge-reports` job in `ci.yml` to download blob reports, merge them, and upload the final HTML report artifact.

## 3. Testing Standard Adjustments

- [x] 3.1 Review and update `vitest.config.ts` and `playwright.config.ts` to ensure compatibility with CI flags (e.g., `--no-isolate`, `--shard`).
- [x] 3.2 Add documentation to the repository's README or contributing guide detailing the new Conventional Commits standard and the requirement for Atomic Commits.
