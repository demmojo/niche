---
name: extract-lessons
description: Extracts lessons learned, friction points, and code complexity from a completed OpenSpec feature before archiving. Updates AGENTS.md and .cursor/rules/ with human approval.
---

# Extract Continual Learning Lessons

The `extract-lessons` command is executed right before archiving a spec. Its job is to ensure the agent captures architectural friction, successful patterns, and workspace idiosyncrasies, persisting them to global or entity memory.

When asked to run `extract-lessons` for a feature at `openspec/changes/<feature-name>`, follow these exact steps sequentially:

### 1. Identify Implementation Friction

Use the `Shell` and `Read` tools to gather context about the completed feature:

1. **Read Task History:** Read `openspec/changes/<feature-name>/tasks.md` to see what was implemented.
2. **Measure Code Complexity:** Use the `Shell` tool to run `git diff origin/master...HEAD` (or `git diff HEAD` if working purely on unstaged/local changes) to analyze the actual codebase changes. Look for convoluted code or workarounds. If the diff is too large, use `git diff --stat` or pipe to `head -n 200` to get a summary.
3. **Scan for Iteration Friction:** Use the `Shell` tool to scan recent terminal outputs. Run `tail -n 100 .cursor/projects/*/terminals/*.txt | grep -i -E "error|failed|exception"` to find test failures, type-checking loops, or API issues encountered during the session. (Alternatively, use chat history context).
4. **Identify Markers:** Synthesize the above to identify Anti-Patterns (what caused friction) and Resolved Patterns (what actually worked).

### 2. Retrieve Existing Rules (Deduplication)

Before proposing new rules, you MUST search existing memory to prevent duplicates and ensure proper placement:

1. Use the `Shell` tool or `Grep` to search `AGENTS.md` and `.cursor/rules/` for keywords related to the extracted lessons (e.g., if you learned about `Firebase Emulator`, grep for `Firebase`).
2. Decide if the new knowledge should:
   - Create a new rule in `.cursor/rules/` (use the `.cursor/skills-cursor/create-rule/SKILL.md` format).
   - Update an existing `.mdc` rule.
   - Be appended to `AGENTS.md` under `## Learned Workspace Facts` or `## Learned User Preferences`.
   - Result in **deleting** an old rule/fact that the new implementation proved is stale.

### 3. Draft Knowledge Updates & HITL Approval

Draft the proposed changes and present them to the user for Human-in-the-Loop (RLHF) approval.
DO NOT write to `AGENTS.md` or `.cursor/rules/` yet.

Present the proposal in this exact Markdown diff format:

```markdown
## Extracted Lessons

- **Anti-Pattern**: [What went wrong / Friction]
- **Resolved Pattern**: [The successful approach / Actionable rule]

## Proposed Memory Updates

**Target:** `[AGENTS.md | .cursor/rules/specific-rule.mdc]`
**Action:** `[Append | Update | Delete]`
**Content:**
\`\`\`diff

- [Proposed addition]

* [Proposed deletion of stale fact]
  \`\`\`

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
