# Tasks

## Phase 1: Setup & DX Improvements
- [x] Add `"openspec": "tsx scripts/openspec-cli/index.ts"` alias to `package.json` scripts.
- [x] Search and replace globally: `docs/plans/` to `openspec/plans/` and `docs/brainstorms/` to `openspec/brainstorms/`.

## Phase 2: CONTRIBUTING.md Overhaul
- [x] Map out the 8-Step Lifecycle (3 Macro-Phases) with Pre-condition, Command, Actor, Output.
- [x] Create and embed the Mermaid state diagram showing the lifecycle and the "Halt & Update" loop.
- [x] Document Escape Hatches (e.g., `start --auto-fix`, unblocking `ai-eval`).

## Phase 3: Cursor Rules & Skills Alignment
- [x] Update `.cursor/rules/openspec-workflow.mdc` to mirror the 8-step nomenclature in a terse, machine-readable format.
- [x] Add CI/CD boundary constraints (dense specs required, CO-STAR UI-only) to rules.
- [x] Update `.cursor/skills/*-openspec/SKILL.md` files to mandate `--non-interactive`, `--json`, `--dry-run`, and `--force` flags.