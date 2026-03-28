# Specification

## Detailed Features

1. **Extraction Trigger (`extract-lessons`)**
   - Reads completed `tasks.md`.
   - Executes `git diff origin/master...HEAD` (or equivalent base branch comparison).
   - Scans `.cursor/projects/.../terminals/` or session chat for defined friction markers (>3 test failures, type checking loops).
   - Synthesizes findings into a temporary summary.

2. **Knowledge Deduplication & Drafting (`knowledge-persistence`)**
   - Executes `grep` or search on `AGENTS.md` and `.cursor/rules/` matching the domain of the extracted lessons.
   - Proposes actionable updates (Add/Modify/Delete).
   - Pauses execution and displays changes to the user for approval.

3. **Archive Interceptor (`archive-openspec` modification)**
   - Parses `.openspec.yaml` upon execution.
   - Checks for `learnings_extracted: true`.
   - If `false` or missing, invokes `extract-lessons` automatically before archiving.

## Scenarios

**Scenario 1: Extracting Lessons upon Completion**

- **WHEN** the user invokes the `extract-lessons` skill after finishing a spec
- **THEN** the skill analyzes the diffs and terminal context, identifying that an MCP context was missing.
- **AND** it searches existing rules, proposes a new rule update to `.cursor/rules/mcp-context.mdc`, and waits for user approval.

**Scenario 2: Archiving Without Extraction**

- **WHEN** the user attempts to run `archive-openspec` directly after verification
- **THEN** the skill checks `.openspec.yaml` and finds `learnings_extracted` is missing.
- **AND** the skill automatically runs `extract-lessons` first.

**Scenario 3: Forgetting Stale Context**

- **WHEN** the continual learning extraction identifies that a previous workaround in `AGENTS.md` is no longer needed (due to a framework update evident in the code diff)
- **THEN** it proposes a deletion of that specific stale instruction during the RLHF phase.
