---
title: Self-Healing Docs & Product Insights
type: brainstorm
status: complete
date: 2026-03-27
---

# Self-Healing Docs & Product Insights

## What We're Building

A self-healing documentation pipeline that shifts drift detection to the `pre-commit` hook. Instead of blocking a push and demanding manual documentation updates, this system automatically synchronizes the codebase's Abstract Syntax Tree (AST) changes with OpenSpec documentation during the commit phase.

Crucially, it transcends being a mere "technical ledger" by analyzing _why_ the code changed. It surfaces product insights (e.g., UX friction, unplanned workarounds, shadow features) and formalizes them into actionable sprint tasks in `tasks.md` or as "Harvested Insights" in the `ROADMAP.yaml`.

## Why This Approach

- **Zero Friction & Perfect Sync:** By intercepting the `pre-commit` lifecycle and using `git add`, any code deviation from the specification is instantly documented and committed alongside the code. The `main` branch never falls out of sync, and the developer isn't blocked at push time.
- **Strategic Value:** It treats documentation drift as a behavioral signal. A workaround isn't just documented; it's analyzed by an LLM to generate a formal "Tech Debt" or "Scope Creep" task, feeding directly into the product team's sprint planning.
- **AST-Driven Precision:** Relying on AST diffs (via tools like `ts-morph`) rather than raw `git diff` text ensures the LLM receives a high-signal, deterministic payload (e.g., "New Component Added," "Endpoint Changed") free of formatting noise.

## Key Decisions

1. **Move Drift Healing to Pre-Commit:** We will transition `scripts/openspec-cli/drift.ts` from a blocking `pre-push` script to an auto-healing `pre-commit` script.
2. **AST-Based Extraction:** We will implement an AST scanner to deterministically extract structural changes (components, state, endpoints) to feed to the LLM, reducing token usage and hallucination.
3. **Auto-Patching Specs & Tasks:** The LLM will generate targeted markdown patches for `spec.md`. If it detects hacky workarounds or scope creep, it will inject new `- [ ] Refactor: ...` items into `tasks.md` or pipe the insight to the `roadmap-extractor.ts`.
4. **Transparent Auto-Commit:** The script will automatically apply the markdown patches and run `git add` on the modified documentation files so they are included in the original commit seamlessly.

## Resolved Questions

- **How do we ensure the AST and docs are perfectly in sync without annoying the developer?** By moving the healing process to `pre-commit` and having the script automatically apply and `git add` the LLM's patch, the commit is created with both the code and docs perfectly aligned, requiring zero manual intervention.
- **Thresholds for Strategic Deviations:** We will rely on the LLM's semantic judgment. If Gemini determines a change fundamentally alters the core user journey or architecture, it will flag it as a "Strategic Deviation." If not, it simply patches the current `spec.md`.
- **Presentation of Sprint Tasks:** Generated sprint tasks (tech debt, scope creep, harvested insights) will be surfaced directly in the project `README.md` documentation, ensuring maximum visibility for the product team.
