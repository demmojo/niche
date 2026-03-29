# Design

## Context
Subagent research and repository review revealed a disconnect between human documentation, agent rules, and the actual codebase state. Stale paths (like `docs/plans/`) remain, and AI agents frequently hang on interactive CLI prompts because flags are not properly enforced in rules.

## Goals
- Unify OpenSpec workflow documentation across the repository.
- Create distinct, optimized personas (Human vs. AI) in the documentation.
- Formalize the 8-step lifecycle and cyclic escape hatches.

## Non-Goals
- Modifying the underlying OpenSpec CLI business logic (we are strictly updating documentation and adding an npm alias).
- Altering the core OpenSpec markdown file formats.

## Decisions
- **SSOT Separation:** `CONTRIBUTING.md` will handle visual and philosophical guidance for humans, while `.cursor/rules/openspec-workflow.mdc` will act as a terse operational constraint list for machines.
- **8-Step Lifecycle:** Upgraded from 7 to 8 phases to elevate `Validate` (`ai-eval` and `validate`) as a critical gate before execution.
- **Agent Flags:** Mandating flags like `--non-interactive` natively in Cursor skills ensures reliable, headless agent execution.

## Risks/Trade-offs
- *Risk:* Duplication of process steps between CONTRIBUTING and rules.
- *Mitigation:* We will enforce strict tone and structure differences. Rules stay terse and actionable; CONTRIBUTING remains explanatory and visual.

## Future Potential
The updated rules and deterministic agent flags pave the way for completely autonomous spec generation, validation, and execution pipelines in CI/CD environments.