# Design

## Context

The OpenSpec CLI automates the creation and staging of feature proposals. Historically, it optimized for clean slates by aggressively clearing temporary (`.tmp`) and target output directories. This design choice proved dangerous for developers who had uncommitted, work-in-progress code inside those directories.

## Goals

- Prevent accidental data loss of uncommitted work during the `propose` command.
- Require explicit user consent before destructive file operations.
- Improve debuggability by preserving staging artifacts upon validation failure.

## Non-Goals

- Completely rewriting the OpenSpec CLI structure.
- Implementing full Git worktree isolation in this specific phase.

## Decisions

- **Interactive by Default**: We will utilize terminal prompts to ask for confirmation before clearing directories. This provides immediate friction against data loss.
- **Headless Safety**: To prevent CI/CD or agentic workflows from hanging, headless execution will strictly require a `--force` flag if a destructive operation is required; otherwise, it will abort.
- **Path Verification**: Archival routines will check `path.startsWith('openspec/plans/')` before modifying files.

## Risks/Trade-offs

- **Workflow Friction**: Users habituated to the CLI automatically overwriting old attempts will now face prompts. The `--force` flag mitigates this for power users.
- **Stale `.tmp` Files**: Preserving `.tmp` directories on failure might clutter the workspace over time. Users must manually clean them up if they abandon a feature.

## Future Potential

- **Automated Worktree Isolation**: Instead of relying on `.tmp` directories, the CLI could leverage isolated Git worktrees for AI-driven scaffolding, ensuring complete isolation from the main working directory and preventing any accidental interaction with the user's uncommitted changes.
