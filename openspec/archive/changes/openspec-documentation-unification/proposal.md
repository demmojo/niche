# Proposal

## Why
The OpenSpec workflow documentation currently suffers from fragmentation and stale paths (e.g., `CONTRIBUTING.md` referencing `docs/plans/` instead of `openspec/plans/`). Furthermore, CLI commands and the lifecycle are not clearly mapped for both human developers and AI agents, leading to hangs and confusion during automated execution.

## What Changes
1. Establish an 8-Step Lifecycle by explicitly adding the Validate phase.
2. Add a Halt & Update Loop to the visual state machine for mid-flight spec changes.
3. Implement Agent-First CLI flags (`--non-interactive`, `--json`, `--force`, `--dry-run`) in Cursor rules and skills.
4. Separate the SSOT: `CONTRIBUTING.md` for human philosophy/diagrams, and Cursor rules for strict machine operations.
5. Enforce CI/CD Boundary Constraints, ensuring generated specs remain dense while conversation summaries stay in the chat UI.

## Capabilities
- Developers gain a clear mental model via a new Mermaid state diagram.
- AI Agents can interact deterministically with the OpenSpec CLI without hanging on prompts.
- A new npm script alias (`npm run openspec`) improves baseline developer experience.

## Impact
Creates a Single Source of Truth for the OpenSpec workflow, significantly reducing cognitive load for developers, preventing AI agent stall errors, and maintaining high architectural density in generated spec documents.