# Tasks

## Phase 1: Overwrite Warnings

- [ ] Update CLI argument parser in `propose.ts` to accept a `--force` boolean flag.
- [ ] Implement a utility for interactive terminal prompts (e.g., using `readline`).
- [ ] Add directory existence checks before `.tmp` clearing logic.
- [ ] Add directory existence checks before `openspec/changes/` clearing logic.
- [ ] Wire up the interactive prompt to these existence checks.
- [ ] Abort with a clear error message if `--force` is missing in non-interactive mode.

## Phase 2: Staging Preservation

- [ ] Refactor the `try/catch/finally` block in `propose.ts`.
- [ ] Move the `.tmp` directory cleanup out of `finally` and into the success path of the `try` block.
- [ ] Log a message instructing the user where to find the preserved `.tmp` files upon failure.

## Phase 3: Strict Archival Validation

- [ ] Locate the plan archiving logic.
- [ ] Add path validation logic: `if (!sourcePath.includes('openspec/plans/')) throw new Error('...');`
- [ ] Write unit tests for the archival path validation.

## Phase 4: Testing & Documentation

- [ ] Manually test interactive overwriting.
- [ ] Manually test staging preservation on failed `ai-eval`.
- [ ] Update OpenSpec CLI documentation to cover the new `--force` flag and staging preservation behaviors.
