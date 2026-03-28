---
name: archive-openspec
description: Archives an OpenSpec change using git mv. Use when the user asks to "archive" an OpenSpec, move a completed feature to the archive, or clean up an implemented change.
---

# Archive OpenSpec Change

The `archive` command is the final step in the OpenSpec lifecycle, performed after a feature is fully implemented and verified. It moves the feature directory from the active changes folder (`openspec/changes/`) to the archive folder (`openspec/archive/`).

## The Archival Process

When asked to archive an OpenSpec change located at `openspec/changes/<feature-name>`, perform the following steps:

### 1. Pre-flight Checks
Use the `Shell` or `Read` tools to check:
1. Does the directory `openspec/changes/<feature-name>` exist?
2. Are all tasks in `tasks.md` checked off (`- [x]`)?
3. Have the changes been reviewed/verified by the user? (If in doubt, ask the user before proceeding.)

### 2. Prepare the Destination
Use the `Shell` tool to ensure the base archive directory exists:
```bash
mkdir -p openspec/archive
```

### 3. Archive using `git mv`
Use `git mv` to safely move the folder to the archive while preserving git history. Do NOT use standard `mv` or `fs.rename` as this breaks history tracking.

Use the `Shell` tool to execute:
```bash
git mv openspec/changes/<feature-name> openspec/archive/<feature-name>
```

### 4. Post-Archival Summary
If the move was successful, inform the user:
> Archived the OpenSpec change from `openspec/changes/<feature-name>` to `openspec/archive/<feature-name>`. 
> 
> The change is ready to be committed!

## Important Notes
- Always use `git mv` and not standard `mv` to avoid git history loss. 
- If the git command fails (for example, if the feature folder contains untracked files), inform the user about the failure and ask if they would prefer you `git add` the files first or just use a regular `mv`.
