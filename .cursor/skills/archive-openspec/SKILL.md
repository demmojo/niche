---
name: archive-openspec
description: Archives an OpenSpec change using git mv. Use when the user asks to "archive" an OpenSpec, move a completed feature to the archive, or clean up an implemented change.
---

# Archive OpenSpec Change

The `archive` command is the final step in the OpenSpec lifecycle, performed after a feature is fully implemented and verified. It moves the feature directory from the active changes folder (`openspec/changes/`) to the archive folder (`openspec/archive/`).

## The Archival Process

When asked to archive or supersede an OpenSpec change located at `openspec/changes/<feature-name>`, perform the following steps:

### 1. Identify Action (Archive vs. Supersede)

Ask or determine if the user wants to **archive** (successfully implemented) or **supersede** (replaced by a newer plan/spec).

### 2. Pre-flight Checks

Use the `Shell` or `Read` tools to check:

1. Does the directory `openspec/changes/<feature-name>` exist? (If it's just a raw plan in `openspec/plans/`, skip to step 3).
2. For an archive: Are all tasks in `tasks.md` checked off (`- [x]`)?
3. Read `openspec/changes/<feature-name>/.openspec.yaml`. Does it contain `learnings_extracted: true`?
   - **CRITICAL:** If `learnings_extracted` is missing or `false`, you MUST abort the archive process and immediately run the `.cursor/skills/extract-lessons/SKILL.md` skill to complete Phase 2.5 of the OpenSpec workflow.
4. Have the changes been reviewed/verified by the user? (If in doubt, ask the user before proceeding.)

### 3. Update State (If Superseding)

If the spec or plan is being **superseded**:

- For an OpenSpec change (`openspec/changes/<feature-name>`):
  - Edit `.openspec.yaml` to include `status: superseded` and `superseded_by: [new-spec]`.
  - Edit `proposal.md` to add `> **NOTICE:** This spec has been **superseded** by [new-spec].` at the very top.
- For a raw plan (`openspec/plans/<plan-name>.md`):
  - Edit the YAML frontmatter to include `status: superseded` and `superseded_by: [new-spec]`.
  - Add `> **NOTICE:** This plan has been **superseded** by [new-spec].` at the very top of the document body.

If the spec is being **archived** (implemented successfully):

- Edit `.openspec.yaml` to include `status: archived` (or update existing status if applicable).

### 4. Execute the Archive via CLI

You MUST use the Dual-Mode OpenSpec CLI to handle the `GitMoveIntent` safely. Do NOT use raw `git mv` or standard `mv` bash commands.

1. **Stage the Archive:**
   Use the `Shell` tool to run:
   ```bash
   npm run openspec archive <feature-name> --stage --non-interactive --json
   ```
2. **Parse the Token and Wait:**
   Parse the `commit_token` and `vscode://vscode.diff/...` URIs from the CLI output. Pause and present the clickable links to the user:
   _"I have staged the archive. Please review the changes via the links above. Reply 'approve' to execute."_
3. **Apply the Archive:**
   Upon receiving natural language approval from the user, execute:
   ```bash
   npm run openspec apply --token=<commit_token>
   ```
   _(If you lose the context or forget the token during chat, run `npm run openspec status --json` to recover it)._

### 5. Post-Archival Summary

If the apply was successful, inform the user:

> Archived the OpenSpec change `<feature-name>` successfully.
>
> The change is ready to be committed!

## Important Notes

- Always use the OpenSpec CLI to ensure DAG consistency and safe `GitMoveIntent` handling.
- If the CLI command fails (for example, if the feature folder contains untracked files), inform the user about the failure and ask if they would prefer you `git add` the files first.
