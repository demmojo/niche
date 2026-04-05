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

### 4. Prepare the Destination

Use the `Shell` tool to ensure the base archive directory exists:

```bash
mkdir -p openspec/archive/changes
mkdir -p openspec/archive/plans
```

### 3. Archive using `git mv`

Use `git mv` to safely move the folder to the archive while preserving git history. Do NOT use standard `mv` or `fs.rename` as this breaks history tracking.

Use the `Shell` tool to execute:

```bash
git mv openspec/changes/<feature-name> openspec/archive/changes/<feature-name>
```

If there is a corresponding raw markdown plan in `openspec/plans/`, archive it as well:

```bash
git mv openspec/plans/<plan-name>.md openspec/archive/plans/<plan-name>.md
```

### 4. Post-Archival Summary

If the move was successful, inform the user:

> Archived the OpenSpec change from `openspec/changes/<feature-name>` to `openspec/archive/changes/<feature-name>`.
>
> The change is ready to be committed!

## Important Notes

- Always use `git mv` and not standard `mv` to avoid git history loss.
- If the git command fails (for example, if the feature folder contains untracked files), inform the user about the failure and ask if they would prefer you `git add` the files first or just use a regular `mv`.
