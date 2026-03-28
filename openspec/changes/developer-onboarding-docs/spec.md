# Specification: Developer Onboarding Docs Update

## 1. README.md Updates

The README must be rewritten to serve as a fast-track tutorial for local setup.

### Prerequisites Table

Must include:

- Node.js (v20.x, with a note to `nvm use`)
- npm (v10.x, included with Node)

### Quick Start

Must include exact, copy-pasteable bash blocks (without `$ ` prefixes):

1. `git clone https://github.com/your-org/nicheai.git` and `npm install`
2. Environment setup (`cp .env.example .env`)
3. Starting the server (`npm run dev`)

## 2. CONTRIBUTING.md Updates

The contribution guide must document the following phases of development:

### Feature Planning (OpenSpec)

- Mandate the OpenSpec workflow for all feature work.
- Direct developers to use the AI agent to `/create-openspec [feature-name]`.
- Explicit Rule: Do not submit PRs for undocumented features.

### Commit Standards

- Strictly follow [Conventional Commits](https://www.conventionalcommits.org/).
- Explain that local `lefthook` checks will reject invalid commit messages on the `commit-msg` hook.
- Define basic types: `feat:` (new feature), `fix:` (bug fix), `chore:` (maintenance/tooling).

### Pull Requests

- CI requirement: All PRs must pass the GitHub Actions CI pipeline (Unit tests, Playwright E2E shards).
- Merge Strategy: Use **Squash and Merge** when merging into `main`.

## 3. Versioning Documentation

Create a new guide at `docs/onboarding/how-to/manage-releases.md` explaining CI-driven versioning:

### Automated Semantic Versioning

- `fix: ...` triggers a **Patch** release.
- `feat: ...` triggers a **Minor** release.
- `feat!: ...` (Breaking Changes) are intentionally downgraded to **Minor** releases for stability.

### Manual Major Bumps

Document the exact steps to bump a major version safely:

1. Go to the **Actions** tab in GitHub.
2. Select the **Release** workflow.
3. Click **Run workflow** and select `Major` for the release type input.
4. Note that CI will bypass the minor downgrade rule, bump `package.json`, generate the changelog, and push the major tag back to `main`.
