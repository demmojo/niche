# Specification: CLI Robustness Hardening

## 1. Process & Terminal Boundaries

- **StdioRouter:** All human diagnostics route to `stderr`. `stdout` is exclusively for JSON output.
- **WHEN** payload is large (>100KB) and `--payload-dump-dir` is not provided, **THEN** output a stderr warning and output payload to stdout (deprecation phase).
- **WHEN** downstream pipe closes, **THEN** an `EPIPE` swallow handler on stdout/stderr will trigger graceful shutdowns instead of throwing.
- **WHEN** `--payload-dump-dir=<path>` is used, **THEN** CLI strictly writes payload to disk via safe serialization, and stdout outputs a deterministic 50-byte pointer: `{ "payloadDumpPath": "..." }`.

## 2. Worktree Teardown & Teardown Abandonment

- **WHEN** tearing down a worktree, **THEN** execute `child_process.spawn` or `spawnSync` with `{ shell: false }` (`exec/execSync` are forbidden). Use standard POSIX arguments `--`.
- **WHEN** an `EBUSY` lock is encountered during teardown, **THEN** abandon directory without moving it, logging a non-fatal warning.

## 3. Idempotent Auto-Recovery

- All staging operations occur inside isolated `.tmp/[ExpiryTimestamp]-[UUID]` directories.
- **Atomic Swap Sequence:** 1) Take POSIX lock (`.openspec-recovery.lock`). 2) Rename live folders (e.g., `node_modules` to `_old_[UUID]`). 3) Rename staging folder into place. 4) Delete `_old_[UUID]` async. 5) Release lock.
- **WHEN** CI environment is detected (`process.env.CI`), **THEN** headless execution bypasses interactive recovery and strictly freezes failed states into `.openspec-failed-artifacts/[UUID]` using a strict error properties allowlist.

## 4. Strict Dependency Validation

- Symlinking is abolished.
- Dependencies are hydrated via `npm ci --prefer-offline --no-audit --ignore-scripts --fund=false` ONLY if `package.json` and `package-lock.json` combined hashes drift from `.openspec-deps-hash`.
- **WHEN** lockfile needs regeneration, **THEN** the local file/workspace paths are dynamically rewritten using streaming JSON transformers to avoid V8 AST blockages.

## 5. Drift Detection & TOCTOU Prevention

- Files are read via cryptographic SHA-256 tokens.
- **WHEN** applying updates, **THEN** directly pipe validated in-memory byte buffers to git index to avoid TOCTOU manual edit overwrites.
- Stream limits are bounded to `MAX_TOTAL_PAYLOAD=500MB` and concurrency limits are scaled to `os.cpus()` count.

## 6. Commit Gates & Pre-Flight Execution

- Commit gates rely on `git diff --cached --quiet`.
- Secret scanning natively runs line-by-line via fixed-window overlapping streams. Re2 usage is forbidden to maintain portability.
- **WHEN** extracting paths, **THEN** enforce `git status --porcelain -z` and explicitly abort if parsed filenames contain newline or tab injections.

## 7. Credential Hygiene

- CLI will NEVER write `.npmrc` files to live disks with secrets.
- **WHEN** injecting tokens, **THEN** an ephemeral config in a staging dir with `0600` permissions is created and unlinked on exit. `process.env` pollution is avoided entirely.
