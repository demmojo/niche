---
title: "feat: AST-Driven Pre-Commit Drift Healing"
type: feat
status: active
date: 2026-03-27
---

# AST-Driven Pre-Commit Drift Healing

## Overview

This feature transforms our defensive documentation drift detection into a proactive, self-healing **Strategic Sprint Engine**. By upgrading from raw git text diffs to Abstract Syntax Tree (AST) parsing (`ts-morph`), the system will automatically synchronize code and OpenSpec documentation with zero friction. Furthermore, it will extract behavioral insights (e.g., technical debt, shadow features, scope creep) and formalize them as actionable sprint tasks.

## Problem Statement / Motivation

Currently, `drift.ts` acts as a gatekeeper on `pre-push`, failing the push and demanding manual documentation updates when code changes. This interrupts developer velocity and treats documentation as a technical chore. Additionally, valuable product insights—like _why_ an engineer built an undocumented workaround—are lost in the git history rather than surfaced to the product team.

## Proposed Solution

1. **Stateless In-Memory AST Diffing:** Use `ts-morph` to extract a concise "Semantic Signature" (new components, props, state hooks, API endpoints) from the Git index (`git diff --cached`). This eliminates disk I/O, lockfiles, and merge conflicts, running in < 100ms.
2. **Synchronous Auto-Healing (Pre-Commit):** A `pre-commit` hook will synchronously call a fast LLM (e.g., Gemini 1.5 Flash) to surgically patch `spec.md`, then run `git add` to seamlessly inject the healed documentation into the developer's current commit. A strict timeout will be enforced to prevent blocking developers if the network drops.
3. **Strategic Sprint Task Generation:** If Gemini detects workarounds or scope creep, it automatically injects a `- [ ] Refactor: ...` task into the relevant `tasks.md` or logs it to `docs/brainstorms/tech-debt.md` if no spec matches, and surfaces it in the project `README.md`.

## Technical Approach

### Architecture

- **`scripts/openspec-cli/ast-scanner.ts`**: A fast, stateless module. It uses `git diff --cached` and `git show HEAD:file` to load the old and new versions of staged files directly into a `ts-morph` in-memory virtual file system (with `isolatedModules: true` to bypass heavy type-checking). It outputs a concise, human-readable structural summary (e.g., `[Added] Component Button.tsx: props.isLoading (boolean)`).
- **Refactored `scripts/openspec-cli/drift.ts`**: Reconfigured to run on `pre-commit`. It consumes the high-signal AST summary, uses existing OpenSpec context (or JSDoc `@spec` tags) to route the change to the correct spec, prompts Gemini to patch the markdown, and executes `git add` on the modified docs.
- **`lefthook.yml` Updates**:
  - `pre-commit`: Triggers the synchronous `drift.ts` auto-heal workflow.

### Implementation Phases

#### Phase 1: Stateless AST Scanner Foundation

- Install `ts-morph`.
- Build `ast-scanner.ts` to operate entirely in-memory using Git index contents.
- Extract only "Semantic Signatures" (exported functions, props, dependencies) rather than full AST JSON trees to keep LLM token usage low and precision high.

#### Phase 2: Refactor `drift.ts` to Pre-Commit Auto-Heal

- Update `drift.ts` to receive the Semantic Signature summary instead of raw git diffs.
- Update the Gemini prompt to generate a surgical markdown patch for the relevant `spec.md`.
- Implement logic to apply the patch to `spec.md` and append a tech debt task to `tasks.md` (or `docs/brainstorms/tech-debt.md` if unroutable).
- Execute `git add <patched-files>` to cleanly bundle the docs into the pending commit.
- **Enforce Timeout:** Ensure the LLM call times out after 3000ms. If it times out, fail open (exit 0) so the commit proceeds without docs, outputting a warning.

#### Phase 3: Workflow Integration & Triage Surface

- Update `lefthook.yml` with the new `pre-commit` workflow.
- Update `generate-docs.ts` (which compiles the `README.md`) to pull any generated Tech Debt tasks and display them in a "Sprint Insights & Drift Triage" section of the root `README.md`.
- **(Experimental)** Change Budget Auditing: Have Gemini detect "Scope Creep" if the AST diff exceeds authorized tasks.

## Acceptance Criteria

### Functional Requirements

- [ ] `ast-scanner.ts` accurately detects added, modified, or removed semantic signatures strictly from staged files in memory.
- [ ] Committing a structural change without a manual doc update results in an automatic, synchronous AI-generated patch to `spec.md` that is included in the same commit.
- [ ] Undocumented architectural changes or workarounds generate a formal task in `tasks.md` or `docs/brainstorms/tech-debt.md`.
- [ ] Generated tech debt/insights are visibly surfaced in the generated root `README.md`.

### Quality Gates

- [ ] `ts-morph` parsing must operate entirely in-memory without a `tsconfig.json` to guarantee sub-100ms execution.
- [ ] The LLM call must timeout at 3s and "fail open" to guarantee developer velocity.
- [ ] No stateful lockfiles (`.openspec/ast-snapshot.lock.json`) are committed to the repository.

## Dependencies & Risks

- **Spec Routing:** Accurately mapping a changed `/src/components/Button.tsx` to the correct OpenSpec requires robust semantic mapping (via `context.ts` or JSDoc tags like `@spec`).
- **LLM Rate Limits:** Running this on every commit could hit API limits. The AST scanner acts as a crucial gate: the LLM is _only_ invoked if structural semantic changes are detected (ignoring pure formatting/CSS commits).

## References & Research

- Brainstorm: `docs/brainstorms/2026-03-27-self-healing-docs-insights-brainstorm.md`
- Related internal scripts: `scripts/openspec-cli/context.ts`, `scripts/openspec-cli/roadmap-extractor.ts`
