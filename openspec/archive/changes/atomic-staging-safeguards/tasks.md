# Tasks

## Phase 1: Overwrite Warnings

- [x] Update CLI argument parser in `propose.ts` to accept a `--force` boolean flag.
- [x] Implement a utility for interactive terminal prompts (e.g., using `readline`).
- [x] Add directory existence checks before `.tmp` clearing logic.
- [x] Add directory existence checks before `openspec/changes/` clearing logic.
- [x] Wire up the interactive prompt to these existence checks.
- [x] Abort with a clear error message if `--force` is missing in non-interactive mode.

## Phase 2: Staging Preservation

- [x] Refactor the `try/catch/finally` block in `propose.ts`.
- [x] Move the `.tmp` directory cleanup out of `finally` and into the success path of the `try` block.
- [x] Log a message instructing the user where to find the preserved `.tmp` files upon failure.

## Phase 3: Strict Archival Validation

- [x] Locate the plan archiving logic.
- [x] Add path validation logic: `if (!sourcePath.includes('openspec/plans/')) throw new Error('...');`
- [x] Write unit tests for the archival path validation.

## Phase 4: Testing & Documentation

- [x] Manually test interactive overwriting.
- [x] Manually test staging preservation on failed `ai-eval`.
- [x] Update OpenSpec CLI documentation to cover the new `--force` flag and staging preservation behaviors.
