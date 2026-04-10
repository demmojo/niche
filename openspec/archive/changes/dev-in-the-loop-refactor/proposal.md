# Proposal: Developer in the Loop (CLI & Agent Refactor)

## Why

Currently, Cursor agents execute OpenSpec CLI commands (like `propose`, `start`, and `archive`) using `--non-interactive` and `--force` flags. While preventing terminal hangs, it creates a "black box" execution model where agents modify critical architecture files without developer oversight. Removing these flags completely would permanently break headless CI/CD pipelines and the `start --auto-fix` self-healing loops mandated in our `AGENTS.md`.

## What Changes

Refactor the OpenSpec CLI and Cursor Agent rules/skills to enforce a **Dual-Mode Execution Architecture**:

1. **Interactive Agent Mode**: Agents must preview changes safely via `--stage` and present the `FsIntent`. Developer approval is required before applying.
2. **Headless CI/CD Mode**: Retains the ability to use `--force` to bypass staging and apply changes atomically for automated pipelines.

## Capabilities

- Intent-based execution gating (`--stage` flag) that safely stores diffs in a `.tmp/openspec_<token>/preview.diff` file.
- Chat-gated application utilizing atomic swaps via `apply --token=<commit_token>`.
- Context recovery to restore execution states via a deterministic `status` command.

## Impact

Secures the system against silent AI mutations and TOCTOU vulnerabilities, integrates smoothly with current tools without vendor lock-in, and fully preserves CI/CD and self-healing automation logic.
