---
title: ML-Powered Documentation Drift Detector
type: feat
status: completed
date: 2026-03-27
---

# Brainstorm: ML-Powered Documentation Drift Detector

## What We're Building

A pre-commit (or pre-push) hook and validation system that uses software and ML best practices to ensure that codebase documentation and user-facing documentation are updated whenever impactful code changes are made.

## Why This Approach

The industry standard is **Docs-as-Code**, where documentation is co-located with code and subject to the same review process. However, relying purely on developers to remember to update documentation fails due to context switching. Fully automated LLM documentation generation also falls short, often resulting in "hallucinations" or high noise.

Our approach focuses on **Semantic Validation over Generation**: using a fast ML model during the git lifecycle to analyze staged code diffs and determine if they invalidate existing documentation.

### Alignment with Internal Learnings

- **Tooling:** We use `lefthook` (already present) instead of Husky to maintain performance.
- **Speed Constraints:** `pre-commit` hooks must run in < 3s. A heavy ML call could block developers, so we need a highly optimized/fast check, or push heavier validation to a `pre-push` hook.
- **OpenSpec Alignment:** The project uses OpenSpec for intent-driven development. Any feature update must first update its OpenSpec proposal/spec.

## Key Decisions

1. **Hook Integration Point:**
   - _Decision:_ We will add a fast LLM-based semantic drift check to our `lefthook.yml` under `pre-commit` (if using an ultra-fast model like Gemini Flash or Claude Haiku) or `pre-push` (to avoid slowing down rapid local commits).
   - _Rationale:_ Catching drift before it enters the CI/CD pipeline prevents stale PRs.
2. **Validation Strategy:**
   - _Decision:_ Use an ML script (`scripts/openspec-cli/drift.ts`) that reads staged files, finds correlated documentation (using a mapping or semantic search), and asks the LLM if the code diff breaks the documentation contract.
   - _Rationale:_ Validation is safer and less noisy than automated generation.
3. **Developer Experience (TUI/Feedback):**
   - _Decision:_ If the LLM detects drift, it will output a clear explanation of _why_ the docs are stale and optionally provide a patch that the developer can review.
   - _Rationale:_ We must protect human-authored context while providing actionable feedback.

## Open Questions

- Should this ML validation strictly run on `pre-commit` (blocking every commit) or `pre-push` (blocking before remote sharing)? Given the <3s rule, `pre-push` might be safer.
- How do we map specific source files to their corresponding user documentation or OpenSpec files without a brute-force search?

---

_Brainstorming complete. Proceeding to planning phase._
