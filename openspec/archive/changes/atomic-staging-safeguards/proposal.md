# Proposal

## Why

Founders and AI agents using the OpenSpec CLI were experiencing silent data loss when running `npm run openspec propose --on-collision=supersede` or similar commands. The CLI automatically wiped out `.tmp` staging directories and the final target directories without warning, which inadvertently deleted untracked work (e.g., React hooks, cron jobs, and test files) that had been placed in those directories. Additionally, non-plan files could be erroneously moved to the archive and deleted.

## What Changes

We are introducing Atomic Staging Safeguards to the OpenSpec CLI, specifically targeting the `propose.ts` command.

1. **Interactive Overwrite Warnings**: The CLI will now explicitly warn and prompt the user before wiping out any existing temporary staging directories (`.tmp`) or completely overwriting final target directories (`openspec/changes/<feature-name>`). In headless mode, it will require a `--force` flag.
2. **Staging Preservation**: If `ai-eval`, DAG validation, or collision checks fail, the temporary files (`.tmp`) will be preserved for inspection rather than being silently deleted.
3. **Strict Archival Validation**: The archiving logic will strictly verify that the file being archived is genuinely located in the `openspec/plans/` directory before moving it.

## Capabilities

### New Capabilities

- `staging-preservation`: Temporary staging directories (`.tmp`) are no longer automatically deleted upon validation failure.
- `interactive-overwrite-warnings`: The CLI interactively prompts users (or requires `--force` in headless environments) before deleting any existing temporary or final target directories.

### Modified Capabilities

- `plan-archival`: The automated plan archival process now includes a directory check to ensure it only archives files originating from `openspec/plans/`.

## Impact

This change strictly affects the `scripts/openspec-cli/propose.ts` command. It ensures safety and trust in the OpenSpec workflow by preventing accidental destruction of uncommitted developer code.
