# Design: Developer Onboarding Docs Update

## 1. Documentation Architecture (Diátaxis Framework)

We will adopt the **Diátaxis framework**, shifting away from a monolithic documentation style to an intent-based structure:

- **Tutorials (Setup)**: The `README.md` acts as the primary entry point, focusing strictly on getting the application running locally.
- **How-To Guides**: Specific developer workflows, like `manage-releases.md`, will reside in `docs/onboarding/how-to/`.
- **Explanation**: Deeper architectural concepts will be moved or created in `docs/onboarding/explanation/`.
- **Reference**: API specs and technical references.

## 2. Developer-Friendly Formatting

- **Prerequisites Matrix**: A clear, tabular format in the README for required tools (Node, npm, etc.) allowing quick environment validation.
- **Copy-Paste Optimization**: Bash and terminal code blocks will intentionally omit the leading `$ ` prompt to allow frictionless, one-click copy-pasting.

## 3. Contribution Workflows

The `CONTRIBUTING.md` will act as the source of truth for repository governance:

- **Feature Planning**: Explicit enforcement of the `openspec/changes/<feature-name>` workflow before PRs are opened.
- **Commit Standards**: Documentation that local `lefthook` hooks enforce the `type(scope): subject` Conventional Commits format.
- **PR Strategy**: Enforcement of GitHub Actions CI checks and a strict "Squash and Merge" policy for merging into `main`.

## 4. Versioning & Release Workflows

Versioning rules will be explicitly documented to clarify the interaction between developers and the CI/CD release bot. This includes explaining the automated downgrading of breaking changes to minor releases for stability, and detailing the manual GitHub Actions workflow required to trigger a major version bump.
