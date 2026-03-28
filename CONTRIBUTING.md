# Contributing to NicheAI

Welcome! This document outlines our standard development, testing, and release workflows. By following these guidelines, you help us keep the codebase healthy, history clean, and releases predictable.

## 1. Feature Planning (The OpenSpec Workflow)

Before writing _any_ code for new features, we use a structured documentation process called **OpenSpec**.

1. **Scaffold a Spec:** Ask the AI agent in your IDE to `/create-openspec [feature-name]`.
2. **Review:** The agent will generate a proposal, design, tasks list, and specification inside the `openspec/changes/<feature-name>` directory.
3. **Approval:** Wait for approval on the Spec before implementing.
4. **Implement:** Do not submit Pull Requests for undocumented or unplanned features.

## 2. Commit Standards (Conventional Commits & Atomic Commits)

We strictly adhere to [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/). This ensures our automated versioning tools (`semantic-release`) can parse commit history to bump versions and generate changelogs accurately.

Additionally, we practice **Atomic Commits**: Each commit should represent one logical, self-contained change. Do not mix unrelated refactors with new features in the same commit.

Our local Git hooks (managed by `lefthook`) run `commitlint` on the `commit-msg` hook to prevent invalid messages from being pushed.

**Valid Formats:**

- `feat: add new reporting dashboard` (New feature, triggers Minor bump)
- `fix: resolve crash on login` (Bug fix, triggers Patch bump)
- `chore(deps): update apollo-client` (Tooling/Maintenance, no release)
- `docs: update setup guide` (Documentation only, no release)

_(Note: Adding `!` after the type, e.g., `feat!: change API response format`, denotes a Breaking Change)._

## 3. Pull Requests & Merging

When you're ready to merge your code into `main`:

1. **Pass CI:** All PRs must pass the GitHub Actions CI pipeline, which runs Unit tests and Playwright E2E matrix shards.
2. **Squash and Merge:** We use the **Squash and Merge** strategy to merge into `main`.
3. **Final Commit Message:** You _must_ ensure that the final squashed commit message adheres to the Conventional Commits format, as this is the message that will trigger the automated release.

## 4. Versioning & Releases

We use automated CI/CD pipelines to manage versions, but you can read all about our process in our dedicated guide:

👉 **[How to Manage Releases & Versioning](docs/onboarding/how-to/manage-releases.md)**

---

### Need Help?

If you're ever stuck on setup, refer back to the [README Quick Start](README.md), or ask the AI agent to explain the repository structure.
