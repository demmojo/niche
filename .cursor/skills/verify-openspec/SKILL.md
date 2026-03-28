---
name: verify-openspec
description: Validates an OpenSpec change implementation against its artifacts. Use when the user asks to "verify" an OpenSpec, check spec coverage, assess design adherence, or validate an implemented feature.
---

# Verify OpenSpec Change

The `verify` command ensures that a change's code implementation correctly aligns with its initial OpenSpec artifacts. It is performed after `apply` is complete but before `archive`.

## The Verification Checklist

When asked to verify a change located at `openspec/changes/<feature-name>`, perform the following validation:

### 1. Artifact Retrieval

Read the change's artifacts in their entirety using the `Read` tool:

- `openspec/changes/<feature-name>/proposal.md`
- `openspec/changes/<feature-name>/design.md`
- `openspec/changes/<feature-name>/specs/<feature-name>/spec.md`
- `openspec/changes/<feature-name>/tasks.md`

### 2. Mechanical Test Coverage Validation

- Use the `Shell` tool to run the deterministic coverage script: `npx tsx scripts/openspec-cli/index.ts check-coverage <feature-name> --threshold=90`.
- If the command exits with `code 1` (coverage below 90%), you MUST mark the verification as **Failed** and halt immediately.

### 3. Task Completion Status

- Check `tasks.md` to ensure every item (`- [ ]`) has been completed and marked as `- [x]`.
- Report any pending tasks to the user immediately. If all are complete, proceed to the next step.

### 4. Spec Coverage & Intent-Based Validation

- Iterate through the detailed requirements in `spec.md`.
- Use the `Glob`, `Grep`, or `SemanticSearch` tools to identify where these requirements were implemented in the codebase.
- Verify that every specified scenario (the `WHEN/THEN` statements) accurately reflects the behavior of the implemented code AND has a corresponding, meaningful intent-based test using MSW/RTL.

### 5. Design Adherence

- Verify that the architecture and approaches match the decisions detailed in `design.md`.
- Did the implementation handle the risks/trade-offs mentioned? Check error handling, edge cases, and specific design patterns.

## Output format

Provide the verification report back to the user formatted as a summary checklist:

```markdown
### Verification Report: [Feature Name]

- [ ] **Test Coverage (90-100%)**: (Pass/Fail) - [Actual % from CLI script]
- [ ] **Tasks Complete**: (Pass/Fail) - [Details]
- [ ] **Spec Scenarios Covered (Intent-Based Test Validation)**: (Pass/Fail) - [Details about missing or correct scenarios & tests]
- [ ] **Design Constraints Met**: (Pass/Fail) - [Notes on architectural adherence]

**Recommendations / Fixes Needed:**

- List any gaps or issues found, or state "Ready to archive."
```

If you identify issues, ask the user if they would like you to fix the code to match the spec, or update the spec to reflect the new design decisions.
