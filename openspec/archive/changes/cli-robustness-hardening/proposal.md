# Proposal: CLI Robustness Hardening

## Context & Objective

The OpenSpec CLI currently suffers from several structural vulnerabilities during edge-case executions. These vulnerabilities include orphaned Git worktrees, metadata data loss during legacy migrations, brittle handling of empty commits, unhandled `EPIPE` exceptions in piped CI environments, and dependency resolution conflicts caused by `node_modules` symlinking.

## What Changes

This plan implements transactional staging directory backups, index-aware git validation, and strict isolation boundaries. We are fundamentally shifting away from brittle process trapping and symlink reliance, moving towards a crash-only, self-healing CLI architecture utilizing OS-native atomicity.

## Capabilities

- **Atomic Directory Swapping:** Utilizes `fs.renameSync` for O(1) POSIX atomic state replacements to eliminate split-brain outcomes.
- **Worktree Lifecycle Resiliency:** Replaces substring matching with Node.js/OS native error code detection (`EPERM`, `EBUSY`), cleanly abandoning locked directories.
- **Conditional Dependency Hydration:** Completely removes `node_modules` symlinking in favor of deterministic, secure cache hydration (`npm ci --prefer-offline`).
- **Payload Dumps & Stdio Router:** Caps streaming sizes and securely redirects output to prevent V8 OOM crashes and `EPIPE` exceptions.

## Impact

This feature ensures maximum robustness against `SIGINT`, `SIGKILL`, hardware crashes, and filesystem locks. Downstream pipelines will experience substantially fewer silent failures, and caching/dependency corruptions will be structurally eradicated.
