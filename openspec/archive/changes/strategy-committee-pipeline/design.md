# Design

## Context

Based on strict workspace rules, adversarial review, and product strategy heuristics, we need an automated way to keep `STRATEGY.md` and `README.md` updated. Previous attempts using raw git diffs failed due to token exhaustion and strategy hallucinations. The new approach leverages the OpenSpec archival process as the authoritative trigger.

## Goals/Non-Goals

**Goals**:

- Synthesize business intent directly from `proposal.md`, `design.md`, and `tasks.md` of archived specs.
- Enforce a strict Socratic prompt using product strategist and adversarial reviewer personas.
- Ensure code and documentation remain coherent via deterministic scoping.
- Handle highly concurrent merges safely.

**Non-Goals**:

- Do not use AST parsing or heavy RAG/VectorDB bloat for coherence checks.
- Do not trigger AI processes on non-archival code pushes.
- Do not rewrite entire documentation files.

## Decisions

- **Trigger**: Run exclusively on `push` to `openspec/archive/**/*.md`.
- **Concurrency & Dropped Jobs**: Use GHA concurrency groups. To handle GitHub's queue limit (which drops intermediate runs), the script will scan the `openspec/archive/` directory for all files modified in the last 24 hours that haven't synced.
- **LLM Engine**: Gemini 3.1 Pro via `@google/genai` enforcing structured outputs via `zodToJsonSchema`.
- **Map-Reduce Coherence Check**: Natively implement a Claim-Verification pipeline. Map extracts atomic claims from docs; Scope filters strictly to explicitly modified files; Reduce runs parallel checks to find violations.
- **Safe Injection**: Use `<!-- STRATEGY_COMMITTEE_START -->` and `<!-- STRATEGY_COMMITTEE_END -->` markers.
- **Git Flow**: Apply `[skip ci]` on commits and strictly run `git pull --rebase origin main` before pushing to handle fast concurrent PR merges.

## Risks/Trade-offs

- **Risk**: Dropped events during burst merges. **Mitigation**: The 24-hour retroactive scan in the orchestration script catches pending updates.
- **Risk**: False positives in Drift Check. **Mitigation**: Explicit instructions to the AI to ignore omissions and TODOs; flag only direct, provable contradictions.
- **Risk**: LLM exposing its mechanical nature. **Mitigation**: Strict prompting forbids mention of internal agents or its AI nature.

## Future Potential

- Routing `DRIFT_DETECTED` reports to Slack/Discord for team review instead of silently logging.
- Extending the Map-Reduce pattern to validate PRs _before_ merge as an optional status check.
