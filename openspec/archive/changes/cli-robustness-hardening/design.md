# Design: CLI Robustness Hardening

## Context

The necessity of running isolated staging operations without polluting the user's workspace requires complex directory management. Previous approaches (symlinks, WAL rollbacks, trapping SIGINT) resulted in race conditions, V8 event loop exhaustion, and orphaned locks.

## Goals / Non-Goals

**Goals:**

- Ensure atomic isolation for all file mutations.
- Protect the system from event loop starvation and DoS on large commits.
- Maintain deterministic crash-recovery across CI and local environments.

**Non-Goals:**

- We will _not_ write a custom complex Write-Ahead Log (WAL) or ledger system.
- We will _not_ trap `SIGINT` (Ctrl+C) or OOM exceptions to process cleanup logic; the CLI embraces a strict crash-only philosophy.

## Decisions

- **EBUSY Abandonment:** Instead of aggressively forcing removal, `git worktree remove` will be used. If background OS locks (`EBUSY`) occur, the CLI abandons the teardown immediately. The cleanup is deferred to the next asynchronous boot sweep.
- **Stdio Isolation:** A `StdioRouter` enforces that all human-readable diagnostics are emitted to `stderr`, leaving `stdout` explicitly for machine-readable JSON.
- **Crash-Only Ephemeral State:** Scaffolding takes place strictly in a `.tmp/[ExpiryTimestamp]-[UUID]` directory. The recovery sweeps are asynchronous and non-blocking on startup.
- **Strict Zod Parsing:** CLI boundary inputs will be strictly validated via Zod instead of raw Commander.js objects, explicitly rejecting payload directory traversals.

## Risks & Trade-offs

- _Trade-off:_ Banning `node_modules` symlinks increases I/O during the first dependency hydration in the staging phase, but this is mitigated by `npm ci --prefer-offline`.
- _Risk:_ Crash-only architectures rely on boot sweeps; if a workspace is rapidly operated upon, there is a micro-window where orphaned files consume disk space before the next cleanup cycle.

## Future Potential

The strict JSON schemas and `--payload-dump-dir` capability natively open the door to massive monorepo enterprise integrations where CLI diff streams exceed hundreds of megabytes.
