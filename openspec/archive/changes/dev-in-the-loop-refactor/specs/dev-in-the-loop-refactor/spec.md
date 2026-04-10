# Spec: Developer in the Loop

## Staging Workflow (`--stage`)

- Mutative commands (`start`, `propose`, `archive`) now accept a `--stage` flag.
- The DAG state is computed but not mutated directly.
- Output writes generated artifacts to a repo-mirrored structure at `.tmp/openspec_<token>/root/`.
- TOCTOU drift detection uses SHA-256 content hashing (synchronous) instead of brittle `mtime` metadata checks, preventing IDE auto-formats from falsely failing valid workflows.
- Outputs a lightweight JSON metadata array of `FsIntent`s to `stdout` containing the `commit_token` and natively generated IDE diff URIs (e.g. `vscode://vscode.diff/...`).

## Apply Workflow (`apply`)

- `npm run openspec apply --token=<commit_token>` takes the generated token.
- Validates the SHA-256 drift hashes targeting the explicitly staged files.
- The `FsExecutor` apply loop implements an Application Ledger (transaction rollback manifest). File operations execute sequentially. If a crash or exception occurs, the ledger overwrites corrupted targets with pre-application backups stored safely inside `.tmp/`.

## State Management & Dual Mode

- `status` reads the `.tmp/` directory and outputs a list of active `commit_token`s with summaries for agent recovery.
- `--force` completely bypasses staging and writes directly, explicitly retained for CI/CD usage.
- All CLI processes enforce that both `stdout` and `stderr` buffers are fully drained before forcing an exit to prevent truncated CI/CD error logs and background hang traps.

## Scenarios

- **WHEN** an agent runs `start --stage`, **THEN** it generates artifacts in `.tmp/`, prints the JSON summary/token/URIs, and halts for developer review via native IDE side-by-side diff links in chat.
- **WHEN** the developer replies "approve", **THEN** the agent executes `apply --token=<commit_token>`.
- **WHEN** a background process alters a targeted file's content between staging and application, **THEN** `apply` strictly fails the hash validation (preventing TOCTOU).
- **WHEN** the agent forgets the active token, **THEN** it runs `openspec status` to list tokens and resumes the apply step.
- **WHEN** executed in a GitHub Action with `start --auto-fix --force`, **THEN** it immediately applies the self-healing correction without entering the staging mode.
