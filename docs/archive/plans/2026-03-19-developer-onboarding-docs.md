# Deepened Plan: Developer Onboarding & Contribution Documentation

## Enhancement Summary

**Deepened on:** 2026-03-19
**Sections enhanced:** 3
**Research agents used:** `best-practices-researcher` (Developer Documentation Best Practices)

### Key Improvements

1. **Diátaxis Framework Adoption:** Structuring documentation by user intent (Tutorials, How-To Guides, Reference, Explanation) rather than monolithic READMEs.
2. **Explicit Versioning Workflows:** Documenting the exact automated semantic versioning pipeline and providing copy-paste commands for manual major version bumps.
3. **Developer-Friendly Setup:** Prioritizing zero-friction copy-pasting, clear prerequisites matrices, and removing `$ ` prefixes from code blocks.

---

## Section 1: Developer Onboarding & Setup Guide (`README.md`)

The `README.md` must serve as a high-speed ramp for new developers to achieve "Time to First Value" (TTFV) in under 10 minutes.

### Research Insights

**Best Practices:**

- Adopt the **Diátaxis framework** to split documentation by intent. The README should act as the Entry Point (Tutorial/Setup), while deeper architectural concepts move to `docs/onboarding/explanation/`.
- Provide a clear, tabular Prerequisites Matrix (Node version, package manager, Docker).
- Use copy-pasteable blocks without the leading `$ `.

**Implementation Details:**

````markdown
## Prerequisites

| Requirement | Version | Notes              |
| ----------- | ------- | ------------------ |
| Node.js     | v20.x   | Use `nvm use`      |
| npm         | v10.x   | Included with Node |

## Quick Start

1. Clone the repository and install dependencies:

```bash
git clone https://github.com/your-org/nicheai.git
cd nicheai
npm install
```
````

2. Set up your environment variables:

```bash
cp .env.example .env
```

3. Start the development server:

```bash
npm run dev
```

````

---

## Section 2: Contribution Guidelines (`CONTRIBUTING.md`)

A comprehensive guide governing how code is planned, written, and committed to the repository.

### Research Insights

**Best Practices:**
- **OpenSpec Enforcement:** Explicitly document that all feature work must begin with an OpenSpec in `openspec/changes/<feature-name>`.
- **Conventional Commits:** Document that `lefthook` enforces the `type(scope): subject` format on the `commit-msg` hook.
- **Squash and Merge:** Establish a strict Squash and Merge policy for PRs to keep the `main` history clean and 1:1 with features.

**Implementation Details:**
```markdown
# Contributing to NicheAI

## 1. Feature Planning (OpenSpec)
Before writing code, scaffold a feature spec using the OpenSpec workflow.
- Ask the AI agent to `/create-openspec [feature-name]`.
- Do not submit PRs for undocumented features.

## 2. Commit Standards
We strictly follow [Conventional Commits](https://www.conventionalcommits.org/). Local hooks (via `lefthook`) will reject invalid commits.
- `feat:` A new feature
- `fix:` A bug fix
- `chore:` Maintenance or tooling

## 3. Pull Requests
- All PRs must pass the GitHub Actions CI pipeline (Unit tests, Playwright E2E shards).
- Use **Squash and Merge** when merging into `main`. Ensure the final commit message follows conventional formatting.
````

---

## Section 3: Versioning & Release Workflows

Clear documentation on how versions are handled, differentiating between automated minor/patch bumps and manual major bumps.

### Research Insights

**Best Practices:**

- Document the automated pipeline: CI automatically bumps `minor` and `patch` versions based on `feat` and `fix` commits using `semantic-release`.
- **Manual Major Bumps:** Explicitly document the developer workflow for incrementing major versions, as `semantic-release` is configured to downgrade breaking changes to `minor` for safety.

**Implementation Details:**
Include this directly in `CONTRIBUTING.md` or a dedicated `docs/onboarding/how-to/manage-releases.md`:

```markdown
## Versioning & Releases

Versions are automatically managed by CI/CD (`semantic-release`).

- `fix: ...` triggers a **Patch** release (e.g., 1.0.0 -> 1.0.1)
- `feat: ...` triggers a **Minor** release (e.g., 1.0.0 -> 1.1.0)
- `feat!: ...` (Breaking Changes) are intentionally downgraded to **Minor** releases for stability.

### How to Increment a Major Version

Major versions (e.g., v1.x.x -> v2.0.0) are strictly controlled via CI to protect the `main` branch history and changelog. To perform a major release, a developer must trigger the manual GitHub Actions workflow:

1. Go to the **Actions** tab in GitHub.
2. Select the **Release** workflow.
3. Click **Run workflow** and select `Major` for the release type input.

_(CI will bypass the standard `minor` downgrade rule for this specific run, bump `package.json`, generate the changelog, and push the `v2.0.0` tag back to `main`)._
```
