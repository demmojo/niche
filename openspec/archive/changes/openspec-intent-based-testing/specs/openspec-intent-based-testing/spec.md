# Specification: Intent-Based Testing Enforcement

## Detailed Features

1. **Red/Green TDD Prompt Sequence:** Ensures tasks are ordered chronologically to force test creation prior to feature logic.
2. **Intent-Based Guardrails:** Prohibits use of internal state inspection, synchronous DOM waits without reason, and raw SDK mocking.
3. **Coverage CLI Validation:** A robust verification wrapper that checks the actual structural coverage mechanically, rejecting LLM hallucination.

## Scenarios

### Scenario 1: Generating an OpenSpec

- **GIVEN** an engineer prompts the `create-openspec` skill
- **WHEN** the agent scaffolds the OpenSpec artifacts
- **THEN** `spec.md` must contain explicit `WHEN/THEN` scenarios mapped to Intent-Based Tests
- **AND** `tasks.md` must place testing validation tasks strictly before code implementation tasks.

### Scenario 2: Applying the OpenSpec

- **GIVEN** an agent begins the implementation phase via `apply-openspec`
- **WHEN** the agent begins a feature task
- **THEN** it must first write the failing tests utilizing RTL/MSW/Firebase Emulators
- **AND** it must prove the tests fail before moving on to code generation.

### Scenario 3: Local Verification & Guardrails

- **GIVEN** an agent completes the feature code
- **WHEN** the agent checks off the task
- **THEN** it must run targeted local test coverage: `npm run test -- <changed-files> --coverage`.

### Scenario 4: Anti-Tautological Intervention

- **GIVEN** local test coverage falls below 90%
- **WHEN** the missing coverage is derived from dead boilerplate or unstructured requirements
- **THEN** the agent must halt, refuse to write vanity tests, and prompt the user to update `spec.md` with a new `WHEN/THEN` scenario.

### Scenario 5: Final Mechanical Verification

- **GIVEN** the `verify-openspec` skill is invoked
- **WHEN** the agent runs the mechanical CLI check
- **THEN** the script must exit with Code 1 if coverage is under 90%, causing the verification process to fail immediately.
