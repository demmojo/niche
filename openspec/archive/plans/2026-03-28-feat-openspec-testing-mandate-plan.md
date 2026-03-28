---
title: Update OpenSpec Lifecycle for Intent-Based Testing
type: feat
status: active
date: 2026-03-28
---

# Update OpenSpec Lifecycle for Intent-Based Testing

## Overview

We are updating the custom OpenSpec workflow (managed via `.cursor/rules` and `.cursor/skills`) to mandate that every new feature implementation must include unit, integration, and intent-based tests with a strict 90% coverage minimum. This ensures that AI agents write robust tests that survive refactoring and validate actual business requirements.

## Problem Statement / Motivation

In an AI-driven lifecycle, there is a high risk of tautological testing—where the AI generates code, and then generates tests that merely confirm the implementation details of that code, rather than validating the business requirements. To combat this, tests must be **intent-based** (verifying outcomes, not implementation) and mandated structurally **before** the code is written.

## Proposed Solution

Embed test mandates deeply into the OpenSpec workflow:

1. **Planning Phase**: Ensure `spec.md` acts as the source of truth with strict Gherkin `WHEN/THEN` scenarios. Force `tasks.md` to include test creation steps strictly _before_ feature implementation steps (Red-Green TDD).
2. **Implementation Phase**: Require the AI agent to run targeted local test coverage checks (`npm run test -- <changed-files> --coverage`) before checking off testing tasks. Apply a "Halt and Update" protocol to tests to prevent tautological testing.
3. **Verification Phase**: Mechanically enforce coverage checks in the `verify-openspec` skill by executing a deterministic CLI command (`npx tsx scripts/openspec-cli/index.ts check-coverage <feature-name> --threshold=90`), halting if coverage drops below 90%.
4. **Agent Guidelines**: Define "Intent-Based Testing" explicitly in `AGENTS.md` (e.g., using React Testing Library, Mock Service Worker, Firebase Emulator, and avoiding internal state mocking).

## Technical Approach

### Architecture

The changes primarily affect the Cursor Rules, Cursor Skills, and Agent instructions.

### Implementation Phases

#### Phase 1: Update Agent Guidelines & Workspace Rules

- Update `AGENTS.md` to define "Intent-Based Testing":
  - **React (UI/DOM):** Use React Testing Library strictly (`getByRole`, `userEvent`). Never use `querySelector` or test internal state. Explicitly forbid wrapping `userEvent` calls in `act()`, and forbid using `waitFor` for synchronous DOM state assertions.
  - **Network:** Mock at the network layer with MSW (Mock Service Worker). Use `AbortSignal` listeners with finite delays to prevent infinite delay memory leaks. Enforce strict teardown rules (e.g., `afterEach(() => server.resetHandlers())` and `afterAll(() => server.close())`) to avoid CI hangs and cross-test contamination.
  - **Firestore:** Use the Firebase Local Emulator Suite. Boot the emulator once globally and isolate tests to prevent concurrency collisions (e.g., by using unique project IDs per test suite or calling `clearFirestoreData({ projectId })` in `afterEach`). Do not mock the Firestore SDK.
  - **Coverage:** Enforce a strict 90% minimum coverage using the `@vitest/coverage-v8` engine (preferred over Istanbul for speed and memory efficiency).
  - **Mutation Testing:** Incorporate Stryker (scoped to pure unit/RTL tests with incremental mode) to verify test quality and combat tautological testing.
  - **Playwright (E2E):** Use resilient selectors (like `data-testid`) and include visual regression testing for core UI flows.
- Update `.cursor/rules/openspec-workflow.mdc`:
  - **Pre-flight / Planning Phase:** Add a requirement that specs outline testing scenarios.
  - **Implementation Phase:** Add a mandatory step to run targeted test coverage (`npm run test -- <changed-files> --coverage`) during the loop.
  - **Post-Implementation / Archive Phase:** Block archiving unless tests pass and coverage is >= 90%.

#### Phase 2: Update OpenSpec Generation & Application Skills

- Update `.cursor/skills/create-openspec/SKILL.md`:
  - Enhance `spec.md` template to explicitly state that `WHEN/THEN` scenarios must map 1:1 to intent-based tests using RTL/MSW.
  - Modify `tasks.md` template to include a mandatory "Testing & Validation" phase. Crucially, tasks to write failing tests must precede implementation tasks (Two-Step Red/Green Prompting Sequence).
- Update `.cursor/skills/apply-openspec/SKILL.md`:
  - Instruct the agent to strictly follow the Red/Green sequence: write tests first, prove they fail, then implement the feature. Do not allow writing tests "alongside" code.
  - Require the agent to run the test suite and verify targeted coverage locally before marking a testing task as completed (`- [x]`).
  - Extend "Halt and Update" protocol:
    1. If a test requires changing the `spec.md`'s `WHEN / THEN` logic, halt and propose the spec change first.
    2. **Anti-Tautological Guardrail**: If intent-based tests yield <90% coverage, do not write "vanity tests" just to inflate the score. Halt and ask the user if the uncovered code is dead boilerplate, or if it requires new `WHEN/THEN` scenarios to be added to `spec.md`.

#### Phase 3: Update Verification Skill

- Update `.cursor/skills/verify-openspec/SKILL.md`:
  - Add mechanical execution: The agent must use the `Shell` tool to run the deterministic CLI coverage script: `npx tsx scripts/openspec-cli/index.ts check-coverage <feature-name> --threshold=90`. This avoids relying on the LLM to parse raw Istanbul/V8 stdout tables.
  - Check coverage: If the command exits with `code 1` (coverage below 90%), mark verification as **Failed** and halt.
  - Update Verification Report checklist format to include `- [ ] **Test Coverage (90-100%)**: (Pass/Fail) - [Actual %]`.
  - Validate Intent-Based Quality: Verify that every `WHEN/THEN` block in `spec.md` has a corresponding meaningful test using MSW/RTL, to act as a semantic check against tautological tests.

## Acceptance Criteria

### Functional Requirements

- [ ] `AGENTS.md` defines Intent-Based Testing and 90-100% coverage requirement.
- [ ] `openspec-workflow.mdc` requires tests during generation and execution.
- [ ] `create-openspec` skill scaffolds test tasks and explicit Gherkin scenarios.
- [ ] `apply-openspec` skill requires running `npm run test -- --coverage` before task completion.
- [ ] `verify-openspec` skill mechanically checks coverage and fails if < 90%.

## Future Considerations

- Add a strict mechanical gate in CI (e.g. GitHub Actions) to enforce the 90% coverage threshold globally.
- Extend `scripts/openspec-cli/eval.ts` (LLM-as-a-Judge) to grade "Testability" of new specs to ensure scenarios are clearly written.
