# Proposal: Educational Tone Refactor

## Why

The AI's current communication style can be overly jargon-heavy, which obscures the fundamental mechanics of the code and hinders the learning process. We need a shift to first-principles educational explanations to improve developer mentoring, without breaking automated pattern recognition (like CI/CD and ai-eval) that rely on dense architectural terminology.

## What Changes

The global CO-STAR User Rule will be refactored to incorporate:

1. The "Anchor and Define" pattern.
2. Complexity scaling for AI explanations.
3. Explicit jargon exemptions for CI/CD, OpenSpec files, and commit messages.
4. Consolidation of rules to avoid DRY violations across `.mdc` and `AGENTS.md` files.

## Capabilities

- The AI will explain literal mechanics (memory, latency, state) before applying architectural labels.
- Explanations will scale dynamically: deep breakdowns for architecture, concise answers for simple fixes.
- AI maintains strict, high-density jargon when modifying `openspec/` files, commit messages, and CI/CD pipelines.

## Impact

This refactor creates a highly effective educational environment for developers while keeping the context window lean. It preserves absolute parity with automated testing and evaluation systems that require precise structural patterns.
