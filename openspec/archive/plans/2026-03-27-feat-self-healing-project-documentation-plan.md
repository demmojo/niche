---
title: Self-Healing Project Documentation (Developer Portal)
type: feat
status: active
date: 2026-03-27
---

# Self-Healing Project Documentation (Developer Portal)

## Overview

The NicheAI workspace lacks a definitive, auto-updating source of truth that acts as a comprehensive Developer Portal. As the AI-assisted development velocity increases, the main `README.md` and high-level architectural documentation rot quickly.

This feature implements a "self-healing" documentation pipeline. By introducing a deterministic `generate-docs` CLI command and integrating it with a `pre-push` git hook, the main `README.md` will be compiled automatically from a static template combined with dynamic data (recent commits, active OpenSpec proposals, roadmap items).

## Problem Statement / Motivation

- **Context Switching:** Developers and AI agents have to search through disparate files (`openspec/changes/`, `src/`) to understand the system's capabilities, env vars, and current tasks.
- **Stale Onboarding:** New contributors struggle to set up the project because `README.md` data sources, integrations, and setup instructions become outdated.
- **Lost Velocity:** Manually updating the documentation after every feature merge slows down the rapid Product Development Lifecycle (PDLC).

## Proposed Solution

1. **Template Architecture:** Move the static, foundational project documentation into a `docs/templates/README.template.md` file.
2. **Dynamic Aggregation Script:** Build `scripts/openspec-cli/generate-docs.ts` to parse OpenSpec directories and git history.
3. **Lefthook `pre-push` Integration:** Run the generator automatically before pushing to remote, amending the commit with the fresh `README.md`.

## Technical Approach

### Architecture

1.  **`docs/templates/README.template.md`**
    - **Static Content:** Product Vision, Architecture Decisions, Design Philosophy, Data Sources & Integrations, Security, Environment Variables, Setup/Run/Test/Contribute instructions.
    - **Injection Markers:**
      - `<!-- OPENSPEC_TABLE_START -->` / `<!-- OPENSPEC_TABLE_END -->`
      - `<!-- GIT_HISTORY_START -->` / `<!-- GIT_HISTORY_END -->`
      - `<!-- ROADMAP_START -->` / `<!-- ROADMAP_END -->`

2.  **`scripts/openspec-cli/generate-docs.ts`**
    - A new script registered in `index.ts`.
    - **OpenSpecs Table:** Uses `getAllSpecs()` to generate a markdown table: `| Feature | Summary | Status | Link |`.
    - **Git Momentum:** Uses `git log -n 10 --pretty=format:"* %s (%h)"` to pull recent activity.
    - **Compilation:** Reads the template, uses regex to replace the content between markers, and writes the output to the root `README.md`.

3.  **Lefthook Configuration**
    - Update `lefthook.yml` to include a `pre-push` command that runs the script and stages/amends `README.md`.

### Implementation Phases

#### Phase 1: Template Creation

- Extract existing `README.md` content into `docs/templates/README.template.md`.
- Expand the static sections (Data Sources, Security, Env Vars, Philosophy) to ensure it covers 2026 best practices.
- Add injection markers.

#### Phase 2: CLI Generator

- Create `generate-docs.ts`.
- Implement extraction logic for OpenSpecs.
- Implement extraction logic for Git log.
- Register `generate-docs` command in `index.ts`.

#### Phase 3: Automation & Hook Integration

- Configure `lefthook.yml` to run the command on `pre-push`.
- Test the compilation pipeline.

## Acceptance Criteria

### Functional Requirements

- [ ] A `README.template.md` file exists and covers all static project aspects.
- [ ] A `generate-docs` command exists in the OpenSpec CLI.
- [ ] The command successfully injects a table of all OpenSpecs with links, statuses, and summaries into the root `README.md`.
- [ ] The command injects recent commit history into the root `README.md`.
- [ ] Pushing to the repository automatically triggers the `generate-docs` script via Lefthook.

## Future Considerations

- **CI/CD Migration:** If local `pre-push` hooks become too heavy, migrate the `generate-docs` command to a GitHub Action that automatically commits doc updates to `main`.
- **Roadmap Extractor Integration:** Currently, `roadmap-extractor.ts` manages a separate file. In the future, this generator could ingest the roadmap YAML data directly.
