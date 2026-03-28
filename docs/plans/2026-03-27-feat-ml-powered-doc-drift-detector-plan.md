---
title: feat: ML-Powered Documentation Drift Detector
type: feat
status: active
date: 2026-03-27
---

# feat: ML-Powered Documentation Drift Detector

## Enhancement Summary

**Deepened on:** 2026-03-27
**Sections enhanced:** Overview, Technical Approach, Implementation Phases
**Research agents used:** best-practices-researcher

### Key Improvements

1. **Automated Roadmap Extraction:** Added a living `docs/ROADMAP.yaml` system that automatically transforms deferred technical decisions (like "Non-Goals") into visionary product features during the git lifecycle.
2. **Docs-as-Code Enforcement:** Refined the architecture to balance fast deterministic checks on `pre-commit` and deep semantic validation on `pre-push`.
3. **Data/Presentation Separation:** Adopted `ROADMAP.yaml` as the source of truth for the living roadmap to prevent LLMs from corrupting complex Markdown formatting.

### New Considerations Discovered

- Top 2026 teams treat documentation drift as errors, not warnings, using pre-commit hooks to enforce compliance.
- Technical debt and deferred features should be translated into product marketing language automatically to maximize the "wow" factor for users and stakeholders.

## Overview

Implement an automated ML-powered documentation validation system that runs during the git lifecycle (specifically as a `lefthook` pre-commit or pre-push hook). This system will detect when new features or code updates invalidate existing codebase or user-facing documentation, enforcing the "Docs-as-Code" paradigm and preventing documentation drift before a commit hits the remote.

## Problem Statement

When code evolves rapidly, documentation inevitably falls out of sync. Relying on developers to remember to update documentation fails due to context switching. While fully automated LLM documentation generation creates noise and hallucinations, a fast, ML-driven validation step can act as a reliable safety net.

Currently, our repository has a strong foundation with `lefthook` and OpenSpec validation (`scripts/openspec-cli/validate.ts`), but it lacks a semantic check to ensure code changes (e.g., modifying an API, altering a UI component, or changing database schemas) are reflected in the associated user and developer documentation.

## Proposed Solution

We will build a fast, ML-powered documentation validation and roadmap extraction system containing two core tools hooked into our existing `lefthook` setup:

1. **Drift Detector (`scripts/openspec-cli/drift.ts`)**: Instead of automatically rewriting documentation (which risks destroying human context), this tool will identify staged code changes, map them to documentation, and evaluate if the changes render existing docs inaccurate.
2. **Roadmap Extractor (`scripts/openspec-cli/roadmap-extractor.ts`)**: A tool that analyzes `design.md` and `proposal.md` files during the git lifecycle. It automatically extracts deferred items (Non-Goals, Alternatives Considered, Future Work) and transforms them into visionary, user-facing "Wow" features in a living `docs/ROADMAP.yaml` document.

## Technical Approach

### Architecture

### Research Insights (from `/deepen-plan`)

**Best Practices:**

- Treat documentation rot as a strict failure: use LLM-driven checks as errors, not warnings.
- Automatically elevate technical compromises into strategic, user-facing "wow" features using a dedicated Roadmap Extractor.
- Use `lefthook` for synchronous validation (drift checks on `pre-push`, roadmap extraction on `pre-commit`).
- The Roadmap Extractor should parse `design.md` sections like "Non-Goals," "Alternatives Considered," and "Risks / Trade-offs" as primary inputs for future roadmapping.
- A "living roadmap" must separate data (e.g., `ROADMAP.yaml`) from presentation (`ROADMAP.md`) so that the LLM can safely append data without corrupting Markdown structure.

**Performance Considerations:**

- Keep `pre-commit` execution under 3 seconds using fast reasoning models (like Gemini 1.5 Flash).
- Implement an LLM bypass (`--ignore-docs`) or defer heavy semantic drift checks to `pre-push` to maintain local commit velocity.

The system will consist of:

1. **Lefthook Integration (`lefthook.yml`)**: We must adhere to our internal standard of keeping `pre-commit` hooks under 3 seconds. Therefore:
   - _Lightweight deterministic checks_ (e.g., checking if `src/api/` was changed but `docs/api/` was not) can run in `pre-commit`.
   - _Heavy semantic ML checks_ should run in the `pre-push` hook, preventing developer friction while still blocking stale code from entering CI.
2. **Drift Analyzer (`scripts/openspec-cli/drift.ts`)**: A new CLI tool that:
   - Runs `git diff HEAD`.
   - Uses `ripgrep` or a lightweight vector store to find related `.md` files in `docs/` and `openspec/`.
   - Sends a concise prompt to the LLM containing the code diff and the documentation snippet.
3. **Interactive TUI / Output**: A terminal-based output that flags the stale documentation and provides an actionable summary of what needs updating.

### Implementation Phases

#### Phase 1: Foundation (Deterministic Pairing)

- **Tasks**:
  - Create a deterministic checker that maps critical source directories (e.g., `src/api`) to documentation directories.
  - Integrate this basic check into the `pre-commit` hook in `lefthook.yml`.
- **Success Criteria**: If a developer changes an API file without touching any markdown file, the commit fails with a warning.
- **Estimated Effort**: Small.

#### Phase 2: ML-Powered Drift Detection (Semantic Validation)

- **Tasks**:
  - Implement `scripts/openspec-cli/drift.ts`.
  - Connect to our standard LLM provider (using a fast model).
  - Write a specialized prompt that ignores refactors, style changes, and minor bug fixes, focusing only on behavior, API, or architecture changes.
  - Add this script to the `pre-push` hook in `lefthook.yml` to preserve local commit speed.
- **Success Criteria**: The `pre-push` hook accurately identifies when a substantive code change contradicts the documentation and blocks the push with a clear explanation.
- **Estimated Effort**: Medium.

#### Phase 3: Integration with OpenSpec & User Docs

- **Tasks**:
  - Ensure the drift detector specifically validates changes against active OpenSpec proposals (`openspec/changes/`) and user guides (`docs/plans/` and `docs/onboarding/`).
  - Introduce an interactive override (e.g., `git push --no-verify` or a custom `--ignore-docs` flag) for emergency hotfixes.
- **Success Criteria**: The drift detector understands the Diátaxis framework and protects human-authored OpenSpec intent.
- **Estimated Effort**: Small.

#### Phase 4: Automated Roadmap & Future Feature Extraction

- **Tasks**:
  - Create a living `docs/ROADMAP.yaml` and `docs/FUTURE.md` as the core strategy artifacts.
  - Implement `scripts/openspec-cli/roadmap-extractor.ts` to run automatically via `lefthook.yml` on `pre-commit` for any changed `.md` or `.yaml` files in the `openspec/changes/` directory.
  - Engineer a "Wow Factor" transformation prompt that reads "Non-Goals", "Alternatives Considered", and "Risks / Trade-offs" from `design.md` files and translates them into visionary, user-facing product roadmap capabilities.
  - Ensure the script safely appends to `ROADMAP.yaml` and auto-compiles/stages `ROADMAP.md` before the commit completes.
- **Success Criteria**: Technical compromises are automatically documented and translated into a strategic, "living" product roadmap document without extra developer effort.
- **Estimated Effort**: Medium.

## Alternative Approaches Considered

- **Fully Automated LLM Documentation Generation on Commit**: Rejected. Generating docs blindly pollutes git history, creates massive "documentation avalanches," and risks hallucinated APIs. Validation is safer and more reliable than generation.
- **Husky over Lefthook**: Rejected. Our internal learnings explicitly dictate using Lefthook for speed and parallelization. Node.js boot overhead in Husky is too high for rapid local development.
- **Running ML in Pre-Commit**: Rejected (tentatively). Unless the ML check can consistently execute in under 3 seconds, putting it in `pre-commit` violates our developer velocity standards. `pre-push` is the optimal balance.

## Acceptance Criteria

### Functional Requirements

- [ ] `scripts/openspec-cli/drift.ts` is implemented and can be invoked via CLI.
- [ ] The script correctly identifies semantic drift between a code diff and a given markdown file.
- [ ] The ML prompt successfully filters out noise (e.g., ignores variable renames or prettier formatting).
- [ ] The detector provides a clear, actionable terminal output explaining _why_ the documentation is stale.

### Non-Functional Requirements

- [ ] The script executes quickly (target < 5 seconds for the `pre-push` hook).
- [ ] Must integrate cleanly into the existing `lefthook.yml` architecture without relying on `husky`.
- [ ] Must rely on the project's existing Node.js toolchain (`tsx`, `typescript`).

## Success Metrics

- **Zero "Stale Doc" PRs**: A 100% reduction in PRs that modify core logic without accompanying documentation updates.
- **Low False Positive Rate**: The ML detector flags genuine drift without constantly blocking developers for minor refactors.
- **Developer Velocity Maintained**: No noticeable slowdown in the local `git commit` loop.

## Dependencies & Prerequisites

- Requires an API key or access to a fast LLM provider (e.g., Gemini Flash, Claude Haiku, or OpenAI gpt-4o-mini).
- Relies on the existing `lefthook` installation.

## Future Considerations

- **Auto-Fix TUI**: Later iterations could pause the `pre-push` hook to present a Terminal UI (TUI) where the developer can interactively accept, edit, or reject an LLM-generated documentation patch.
- **Vector Database Integration**: For larger codebases, replacing simple `ripgrep` with a lightweight local vector store (like `chromadb` or a simple SQLite cosine similarity setup) to find related documentation more accurately.

## References & Research

### Internal References

- Pre-commit Performance Standards: `docs/plans/2026-03-18-dev-cicd-pipeline-deepened.md` (Keep `pre-commit` under 3s, defer heavy tasks to `pre-push`).
- OpenSpec Validation: `scripts/openspec-cli/validate.ts`
- Documentation Structure (Diátaxis): `docs/plans/2026-03-19-developer-onboarding-docs.md`

### External References

- Docs-as-Code Best Practices 2026: Shift-left validation using deterministic and semantic checks.
- LLM Drift Checkers (e.g., `docdrift` architectural patterns).
