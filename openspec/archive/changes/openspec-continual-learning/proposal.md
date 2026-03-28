# Proposal

## Why

Currently, NicheAI's OpenSpec workflow terminates after a spec is verified and archived. While this maintains workspace hygiene, it abandons valuable process metadata—such as architectural struggles, API friction, or intent-based testing difficulties encountered during implementation. According to best practices (e.g., CrewAI's Iterative Improvement Pattern and Task Evaluator models), immediate post-execution knowledge extraction is the primary mechanism for lifelong learning in agentic workflows. By running a continual learning skill before archiving, NicheAI can prevent its agents from repeating mistakes and progressively accumulate contextual knowledge (e.g., updating `AGENTS.md` and `.cursor/rules/*.mdc`).

## What Changes

- Introduce a formal Phase 2.5: "Continual Learning & Extraction" into the OpenSpec lifecycle, injected between Verification and Archival phases.
- Create a new skill (`.cursor/skills/extract-lessons/SKILL.md`) that triggers when a user asks to finalize/archive a spec.
- Update `.cursor/rules/openspec-workflow.mdc` to mandate this continual learning step.

## Capabilities

### New Capabilities

- `continual-learning-extraction`: Evaluates the just-completed `tasks.md`, **code complexity (via `git diff origin/master...HEAD`)**, and iteration friction (via chat context and `.cursor/projects/.../terminals/`), extracting key learnings, friction points, and workspace idiosyncrasies. It specifically looks for defined friction markers (e.g., >3 test failures, type-checking circles, missing MCP context).
- `knowledge-persistence`: Drafts **deduplicated** proposed updates to `AGENTS.md` (Long-Term Memory) or `.cursor/rules/` (Entity Memory) and presents them to the developer for Human-in-the-Loop (RLHF) approval. It must perform a **SemanticSearch or Grep Retrieval step** first to read existing rules to prevent duplicates, and it can propose **deletions (forgetting)** of stale facts.

### Modified Capabilities

- `archive-openspec`: Modified to programmatically enforce that the continual learning phase is executed before archiving the spec. It will explicitly check for a hard artifact (e.g., `learnings_extracted: true` in `.openspec.yaml`) or call the `extract-lessons` prompt as its first internal step.

## Impact

- `openspec-workflow` rule
- `archive-openspec` skill
- `extract-lessons` skill
- `AGENTS.md` and `.cursor/rules/` (Downstream knowledge stores)
