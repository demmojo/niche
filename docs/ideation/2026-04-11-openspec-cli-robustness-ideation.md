---
date: 2026-04-11
topic: openspec-cli-robustness
focus: Address adversarial findings from ripcord-audit-gate-cli-hardening
---

# Ideation: OpenSpec CLI Robustness & Failure Scenarios

## Codebase Context

The `ripcord-audit-gate-cli-hardening` OpenSpec was completed, introducing Git Worktree isolation, OS-native locking, safe async exits, and legacy spec migration. However, adversarial review surfaced several edge cases and anti-patterns that threaten the stability of the CLI under stress, particularly around isolation leaks, teardown failures, and metadata loss.

## Ranked Ideas

### 1. Fix Worktree Orphan Leaks in `cleanupOldStaged`

**Description:** Modify `cleanupOldStaged` to proactively delete the `.openspec-worktrees/<token>` directory from the filesystem before running `git worktree prune`.
**Rationale:** Currently, deleting the JSON intent file does not delete the worktree folder. `git worktree prune` ignores worktrees that still exist on disk, leading to permanent disk space bloat and Git repository pollution.
**Downsides:** Requires careful `fs.rmSync` targeting to avoid deleting active worktrees.
**Confidence:** 95%
**Complexity:** Low
**Status:** Unexplored

### 2. Preserve Custom Metadata in Legacy Migration

**Description:** Update `migrateLegacySpecs` to deep-merge the existing YAML `rawData` with the new schema fields rather than constructing a whitelisted object from scratch.
**Rationale:** The current migration script silently deletes any custom YAML metadata (e.g., developer notes, custom task arrays) present in legacy specs, causing data loss.
**Downsides:** May preserve invalid or deprecated schema fields alongside the required ones.
**Confidence:** 95%
**Complexity:** Low
**Status:** Unexplored

### 3. Graceful Empty Commit Handling in `applyStaged`

**Description:** Wrap the `git commit` execution in `applyStaged` in a specific `try/catch` that detects "nothing to commit". If detected, safely proceed to the worktree cleanup phase instead of aborting early.
**Rationale:** If an intent results in a no-op (no files changed), `git commit` throws an error. The current implementation catches this and `return`s immediately, skipping the cleanup of the branch and worktree.
**Downsides:** None.
**Confidence:** 90%
**Complexity:** Low
**Status:** Unexplored

### 4. Handle `EPIPE` Stream Destruction in `safeExit`

**Description:** Wrap the `process.stdout.write` and `process.stderr.write` calls inside `safeExit` in `try/catch` blocks, or attach `.on('error')` handlers, to prevent `ERR_STREAM_DESTROYED` from bubbling up as an unhandled promise rejection.
**Rationale:** If a downstream consumer (like a CI orchestrator or `head`) closes the pipe before the CLI finishes emitting a large JSON payload, `safeExit` will crash ungracefully.
**Downsides:** Requires careful stream error handling to ensure the process still exits with the correct code.
**Confidence:** 85%
**Complexity:** Medium
**Status:** Unexplored

### 5. Remove `node_modules` Symlinking from Worktrees

**Description:** Remove the automated `fs.symlinkSync` for `node_modules` in `stageIntents`. Instead, rely on the base repository's package manager cache, or execute intents that don't require localized module resolution.
**Rationale:** Symlinking `node_modules` breaks true isolation (an agent could mutate the base `node_modules` via the worktree) and frequently breaks Node resolution algorithms (e.g., React "Invalid Hook Call") due to diverging `realpath`s.
**Downsides:** Agents running code inside the worktree might need to run `npm install`, which is slow.
**Confidence:** 80%
**Complexity:** Medium
**Status:** Unexplored

## Rejection Summary

| #   | Idea                               | Reason Rejected                                                                                                                                                                   |
| --- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Remove Global Lock completely      | The global lock is required to prevent multiple CLI instances from stepping on each other's staging metadata; instead, scoping the lock per-feature should be brainstormed later. |
| 2   | Dynamic Port Probing for Worktrees | Out of scope for filesystem robustness; port probing should be handled by the specific agent/server spawned inside the worktree, not the CLI orchestrator.                        |

## Session Log

- 2026-04-11: Initial ideation — 7 generated, 5 survived. Ideas derived from adversarial review of OpenSpec CLI hardening.
