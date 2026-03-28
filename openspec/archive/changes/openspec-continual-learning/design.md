# Design

## Context

Agentic development workflows require continuous contextual improvement to be truly autonomous. Without capturing lessons from implementation struggles, agents repeatedly make the same localized errors. Archival represents a natural transition point to summarize "what we learned" before wiping the immediate context.

## Goals & Non-Goals

**Goals:**

- Capture friction points immediately after task completion.
- Persist knowledge into persistent stores (`AGENTS.md`, `.cursor/rules/`).
- Keep memory concise by actively deduping and forgetting stale rules.
- Ensure strict human oversight (RLHF) before committing rule changes.

**Non-Goals:**

- Fully autonomous updates to core configurations without user approval.
- Tracking per-user analytics or external telemetry.

## Decisions

1.  **Phase 2.5 Injection:** The learning phase is distinctly isolated from Verification to ensure the code is completely working before we try to learn from it.
2.  **State Marker:** `.openspec.yaml` will use a boolean `learnings_extracted` to ensure the archive command doesn't skip the learning phase.
3.  **Heuristics over Deep Learning:** We will use deterministic heuristics (git diffs, terminal logs, ">3 test failures") to trigger LLM summary rather than external complex evaluation models.

## Risks & Trade-offs

- **Token Limit Exhaustion:** Passing large `git diff` outputs or complete terminal logs might exceed context limits. _Mitigation:_ Cap diff lines and prioritize recent terminal outputs or explicit summaries.
- **Rule Bloat:** Automatically proposing new rules might lead to bloated `.mdc` files. _Mitigation:_ Require a pre-flight grep/semantic search to deduplicate or modify existing rules instead of always appending.

## Future Potential

- Connecting extracted lessons directly into an external Vector Database for cross-repository organizational learning.
- Dynamically tracking agent "performance scores" across spec executions.
