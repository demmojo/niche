---
name: apply-openspec
description: Applies (implements) an OpenSpec change. Use when the user asks to "apply" an OpenSpec, implement a feature spec, or execute the tasks for a specific change.
---

# Apply OpenSpec Change

The `apply` command in the OpenSpec workflow translates a finalized specification into code by executing the steps outlined in its `tasks.md`.

## Workflow

When the user asks to "apply" a change located at `openspec/changes/<feature-name>`:

1. **Read the Full Context**: Read `proposal.md`, `design.md`, and `specs/<feature-name>/spec.md` to understand the full architectural and product requirements. Do not start coding before reading these.
2. **Review Tasks**: Read `tasks.md`. Identify which tasks are already completed (`- [x]`) and which are pending (`- [ ]`).
3. **Iterative Implementation**:
   - Pick the first pending task. Follow the strict **Two-Step Red/Green Prompting Sequence**: write failing intent-based tests _before_ writing the feature logic. Prove the tests fail, then implement the logic to make them pass. Do not write tests "alongside" code.
   - Use the necessary tools (Read, Glob, Grep, SemanticSearch) to find the relevant code.
   - Implement the changes according to the design and specs.
   - After successfully implementing a task, run targeted local test coverage: `npm run test -- <changed-files> --coverage`.
   - Update `tasks.md` by changing the `- [ ]` to `- [x]` for that specific task.
   - If a task is blocked, complex, or ambiguous, ask the user for clarification before proceeding.
   - **Extended Halt and Update Protocol:**
     1. If a test requires changing the `spec.md`'s `WHEN / THEN` logic, halt and propose the spec change first.
     2. **Anti-Tautological Guardrail:** If intent-based tests yield < 90% coverage, do NOT write "vanity tests" just to inflate the score. Halt and ask the user if the uncovered code is dead boilerplate, or if it requires new `WHEN/THEN` scenarios to be added to `spec.md`.
4. **Finalization & Documentation Sync**:
   - Once all tasks in `tasks.md` are checked off, you must synchronize the project's documentation.
   - **Update Landing Page Master**: Review `docs/landing-page-master.md`. If the new feature provides significant value, add or update its section, value proposition, and proposed video visuals.
   - **Update In-App Documentation**: Review and update any impacted in-app documentation to reflect the new feature reality. This includes updating `src/components/PageGuideModal.tsx` guides, inline `Tooltip` components, page titles, and feature descriptions.
   - **Update Feature Videos**:
     - If the OpenSpec modifies an existing feature that has a recorded walkthrough in the `docs/landing-page-master.md`, use the `scripts/generate_feature_videos.cjs` script to regenerate the WebM video for that feature.
     - If the OpenSpec introduces a major new feature, update the Playwright script to include the new feature, run it to capture the WebM, and add its details to the `docs/landing-page-master.md`.
   - Suggest that the user `verify` the change.

## Important Constraints

- **Do NOT guess requirements**: If a detail is missing from the spec, ask the user.
- **Maintain design adherence**: Only introduce new patterns if approved by the `design.md`.
- **Frequent updates**: Mark tasks as done individually. Do not wait until the very end to check them all off at once, as this risks losing track of progress.
