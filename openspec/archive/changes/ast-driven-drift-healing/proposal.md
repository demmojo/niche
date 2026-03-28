# Proposal: AST-Driven Pre-Commit Drift Healing

## Why

Currently, `drift.ts` acts as a gatekeeper on `pre-push`, failing the push and demanding manual documentation updates when code changes. This interrupts developer velocity, treats documentation as a technical chore, and causes valuable product insights (e.g., _why_ an engineer built an undocumented workaround) to be lost in git history.

## What Changes

We will transform documentation drift detection into a proactive, self-healing **Strategic Sprint Engine**. By upgrading from raw git text diffs to Abstract Syntax Tree (AST) parsing (`ts-morph`), the system will automatically synchronize code and OpenSpec documentation with zero friction during the `pre-commit` phase.

## Capabilities

1. **Stateless In-Memory AST Diffing:** Generates concise "Semantic Signatures" (new components, props, hooks) directly from the Git index (`git diff --cached`) using `ts-morph` in < 100ms.
2. **Synchronous Auto-Healing:** Uses a fast LLM (e.g., Gemini 1.5 Flash) to synchronously patch `spec.md` and runs `git add` to inject the updated documentation into the current commit.
3. **Strategic Sprint Task Generation:** Extracts behavioral insights (technical debt, workarounds, scope creep) and formalizes them into actionable sprint tasks.

## Impact

This upgrade completely removes documentation friction for developers, guarantees that specs are always up-to-date, and automatically translates hidden technical debt into visible sprint tasks.
