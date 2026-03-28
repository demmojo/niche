# Design: AST-Driven Pre-Commit Drift Healing

## Context

Currently, documentation drift is caught late (`pre-push`) via raw text diffs, creating noisy false positives and manual work. Moving the check to `pre-commit` and making it an automated, AST-based "auto-heal" mechanism shifts the system from an annoying gatekeeper to an invisible assistant.

## Goals

- Sub-100ms structural code diffing.
- Zero developer friction (synchronous auto-healing within the commit).
- Automatic extraction of technical debt into actionable sprint tasks.

## Non-Goals

- Heavy TypeScript type-checking or compiling.
- Blocking developer workflows due to LLM latency or network drops.

## Decisions

- **Use `ts-morph`:** For extracting semantic signatures instead of processing raw Git strings.
- **In-Memory VFS:** Run diffs strictly in memory on staged files to eliminate disk I/O, lockfiles, and merge conflicts.
- **Fail-Open Timeout:** Enforce a strict 3000ms timeout for the LLM auto-heal call. If it times out, the process exits with `0` so the commit proceeds without docs.

## Risks & Trade-offs

- **Spec Routing:** Accurately mapping a changed file (e.g., `/src/components/Button.tsx`) to the correct OpenSpec requires robust semantic mapping. _Mitigation:_ Rely on existing `context.ts` or JSDoc `@spec` tags.
- **LLM Rate Limits:** Running LLMs on `pre-commit` could hit API limits. _Mitigation:_ The AST scanner acts as a strict gate, invoking the LLM _only_ if structural semantic changes are detected (ignoring formatting/CSS commits).

## Future Potential

- **Change Budget Auditing:** Gemini could be prompted to detect "Scope Creep" if the AST diff indicates changes vastly exceeding the authorized sprint tasks.
