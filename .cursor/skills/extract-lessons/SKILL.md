---
name: extract-lessons
description: Extracts lessons learned, friction points, and code complexity from a completed OpenSpec feature before archiving. Updates AGENTS.md and .cursor/rules/ with human approval.
---

# Extract Continual Learning Lessons

The `extract-lessons` command is executed right before archiving a spec. Its job is to ensure the agent captures architectural friction, successful patterns, and workspace idiosyncrasies, persisting them to global or scoped memory.

### 1. Mine High-Signal Friction

Use the `Shell` and `Read` tools to gather context about the completed feature:

1. **Read Task History:** Read `openspec/changes/<feature-name>/tasks.md` to see what was intended.
2. **Mine Agent Transcripts:** Read the recent session transcripts in `/home/demmojo/.cursor/projects/home-demmojo-Code-nicheai/agent-transcripts/*.jsonl`. Look for high-signal friction:
   - User corrections (e.g., "No, use X instead", "Fix the type error").
   - Tool failure loops or repeated test failures.
   - Architectural pivots during the session.
3. **Measure Code Complexity:** Use `git diff origin/master...HEAD` to find the actual code that resolved the friction.
4. **Synthesize:** Identify the **Anti-Pattern** (what caused the friction/failed) and the **Resolved Pattern** (the concrete fix). Identify the **Reference File** that contains the ideal implementation.

### 2. Semantic Deduplication & Placement

Before proposing rules, you MUST search existing memory to prevent "split-brain" contradictions:

1. Use `SemanticSearch` and `Grep` across `AGENTS.md` and `.cursor/rules/` for the concepts you extracted.
2. **Determine Scoping (CRITICAL):**
   - **Scoped Rule (`.mdc`):** If the lesson applies to a specific language, framework, or directory (e.g., React hooks, Playwright tests, Firebase), you MUST target or create a `.cursor/rules/*.mdc` file with appropriate `globs`.
   - **Global Rule (`AGENTS.md`):** ONLY target `AGENTS.md` if the lesson is a universal truth applicable to _every_ interaction (e.g., Git workflow, agent communication style).
3. **Enforce One Truth:** If the new knowledge contradicts or refines an existing rule, you must explicitly propose deleting the stale rule.

### 3. Draft Knowledge Updates & HITL Approval

DO NOT write to `AGENTS.md` or `.cursor/rules/` yet. Present the proposal for RLHF approval in this exact format:

```markdown
## Extracted Lessons

- **Anti-Pattern**: [What went wrong / AI hallucination / Friction]
- **Resolved Pattern**: [The successful approach / Actionable rule]
- **Concrete Reference**: `[Path to a file in the workspace containing the good pattern]`

## Proposed Memory Updates

**Target:** `[.cursor/rules/specific-rule.mdc | AGENTS.md]`
**Action:** `[Create | Append | Update | Delete]`
**Content:**
\`\`\`diff

- [Proposed addition]

* [Proposed deletion of stale/contradicting fact]
  \`\`\`

_(Note: If targeting AGENTS.md and the list exceeds 20 items, proactively propose refactoring related bullet points into a new .mdc rule to prevent instruction dilution.)_

Do you approve these changes? (Yes/No)
```

### 4. Commit and Chain State

Wait for the user's explicit approval. If they request edits, adjust the proposal and ask again.

Once approved:

1. Use the `Write` or `StrReplace` tools to apply the changes to `AGENTS.md` and/or `.cursor/rules/`.
2. Open `openspec/changes/<feature-name>/.openspec.yaml` and update the `learnings_extracted` flag:
   ```yaml
   learnings_extracted: true
   ```
3. Inform the user that extraction is complete and immediately execute the `.cursor/skills/archive-openspec/SKILL.md` skill to finalize the workflow.
