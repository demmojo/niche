# Tasks: Intent-Based Testing Implementation

## Phase 1: Update Agent Guidelines & Workspace Rules

- [x] Update `AGENTS.md` to define "Intent-Based Testing".
  - [x] Enforce React Testing Library strictly (forbid `querySelector`, forbid `act()` wraps on `userEvent`).
  - [x] Enforce MSW for network mocking (with explicit teardown rules and finite delay `AbortSignal` listeners).
  - [x] Enforce Firebase Local Emulator Suite (forbid Firestore SDK mocking, enforce isolation/cleanup).
  - [x] Define 90% minimum coverage via `@vitest/coverage-v8`.
  - [x] Incorporate Stryker rules for mutation testing.
- [x] Update `.cursor/rules/openspec-workflow.mdc`.
  - [x] Pre-flight: Mandate testing scenarios outlined in specs.
  - [x] Implementation: Mandate targeted test coverage execution during the dev loop.
  - [x] Archive: Block archiving unless tests pass and coverage is >= 90%.

## Phase 2: Update Skills (`create-openspec` and `apply-openspec`)

- [x] Enhance `.cursor/skills/create-openspec/SKILL.md`.
  - [x] Update `spec.md` template to map `WHEN/THEN` scenarios 1:1 with intent-based tests.
  - [x] Update `tasks.md` template to strictly order test creation tasks before feature logic tasks (Two-Step Red/Green Prompting Sequence).
- [x] Enhance `.cursor/skills/apply-openspec/SKILL.md`.
  - [x] Instruct agents to explicitly follow the Red/Green sequence.
  - [x] Require agents to verify targeted coverage locally before task completion.
  - [x] Add the Anti-Tautological Guardrail ("Halt and Update" protocol for low coverage boilerplate).

## Phase 3: Update Verification Skill

- [x] Enhance `.cursor/skills/verify-openspec/SKILL.md`.
  - [x] Add mechanical Shell tool execution for `npx tsx scripts/openspec-cli/index.ts check-coverage <feature-name> --threshold=90`.
  - [x] Enforce hard halt if the command exits with code 1.
  - [x] Update the Verification Report format to include `- [x] **Test Coverage (90-100%)**: (Pass/Fail) - [Actual %]`.
  - [x] Add semantic validation check to ensure every `WHEN/THEN` block in `spec.md` is covered by a meaningful MSW/RTL test.
