# Design: Update OpenSpec Lifecycle for Intent-Based Testing

## Context

Current OpenSpec workflows allow AI agents too much flexibility in how and when tests are written. This often results in tests being generated as an afterthought, leading to tight coupling with implementation details rather than verifying the business requirements defined in `spec.md`.

## Goals

- Mandate test creation _before_ feature implementation in the OpenSpec loop.
- Enforce "Intent-Based Testing" using specific, robust testing utilities (RTL, MSW, Firebase Emulator).
- Automate test coverage verification using deterministic CLI execution instead of relying on the LLM's interpretation of raw test output.
- Mitigate tautological testing through strict "Halt and Update" protocols.

## Non-Goals

- Building out the entire CI/CD GitHub Actions enforcement structure (this will be handled in a future iteration).
- Writing tests for legacy features without OpenSpecs.

## Decisions

- **Coverage Engine:** We will use `@vitest/coverage-v8` instead of Istanbul due to superior speed and memory efficiency.
- **Mechanical Enforcement:** Agents will execute `npx tsx scripts/openspec-cli/index.ts check-coverage <feature-name> --threshold=90` via the Shell tool. A non-zero exit code automatically marks verification as failed.
- **Mutation Testing:** Incorporate Stryker incrementally to verify the quality of RTL/unit tests.

## Risks / Trade-offs

- **Risk:** Agents may struggle to write initial tests without code context (Red phase). **Mitigation:** Highly detailed Gherkin `WHEN/THEN` syntax in `spec.md` will serve as the prompt context.
- **Risk:** Firebase Emulator and MSW can introduce flakiness if teardowns are poor. **Mitigation:** Explicit rules added to `AGENTS.md` enforcing strict teardowns (e.g., `afterAll(() => server.close())`, unique project IDs for Firestore).

## Future Potential

- Adding strict mechanical gates in CI (e.g., GitHub Actions) to globally enforce the 90% threshold.
- Integrating an LLM-as-a-Judge mechanism (`eval.ts`) to programmatically grade the "Testability" of new specs before implementation begins.
