# Spec

## Detailed Features

### 1. Interactive Overwrite Warnings

Before the CLI executes a wipe of a `.tmp` directory or an `openspec/changes/<feature-name>` directory, it checks for existence. If present, it intercepts the execution flow.

### 2. Staging Preservation

The error handling block within `propose.ts` is modified. Instead of a `finally` block that invariably clears `.tmp`, the cleanup only occurs on successful completion.

### 3. Strict Archival Validation

The function responsible for moving the markdown plan to the archive directory computes the absolute/relative paths and validates the source path.

## Scenarios

### Scenario: Interactive overwrite of existing target

- **WHEN** the user runs `propose` AND the target directory exists
- **THEN** the CLI pauses and prompts "Directory <path> exists. Overwrite? (y/N)"
- **AND** proceeds only if the user inputs 'y'.

### Scenario: Headless overwrite without force flag

- **WHEN** the CLI is running in a non-interactive environment (or an agent environment)
- **AND** the target directory exists
- **AND** the `--force` flag is omitted
- **THEN** the CLI aborts the operation and throws a safety error.

### Scenario: Validation failure during proposal

- **WHEN** the DAG validation or `ai-eval` step fails
- **THEN** the CLI outputs the error details
- **AND** leaves the `.tmp` directory intact for user inspection.

### Scenario: Erroneous archival attempt

- **WHEN** the CLI attempts to archive a file not located in `openspec/plans/`
- **THEN** the CLI throws an `InvalidArchivePathError` and does not delete or move the file.
