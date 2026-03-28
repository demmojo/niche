# Design: Codebase Bug Hunt and Test Quality Review

## Context

The NicheAI codebase requires a robust QA pass before the upcoming major release. We are pivoting away from complex dynamic test generation and heavily mocked systems toward tangible, integration-heavy configurations utilizing concrete API structures and strict coverage assertions.

## Goals

- Fortify existing tests by replacing brittle array-based selectors with accessible queries (`getByRole`).
- Standardize global console mock suppression to reveal hidden React warnings.
- Implement separate, decoupled coverage gates for Frontend (JSDOM) and Backend (Node).
- Emulate external dependencies safely with static hardcoded JSON fixtures and MSW v2.

## Non-Goals

- Building a custom AST generator (`ts-morph`) for test scaffolding.
- Creating a live record-replay MSW proxy mechanism with PII redaction.
- Full end-to-end testing of every UI onboarding step (use API seeding instead).

## Decisions

- **YAGNI Simplification**: Discard Phase 2 AST Code Gen & Live Proxies. We will write missing tests manually to save infrastructure-building time.
- **Vitest Multi-Config Setup**: Ensure `vitest.config.ts` (Frontend) and `vitest.cli.config.ts` (Backend) are completely decoupled to prevent DOM globals from polluting the CLI environment.
- **Zustand Testing Focus**: Shift focus to the integration boundary between React unmounting lifecycles and Zustand async promises. Zustand stores will be tested natively using the vanilla JS API (`getState`, `setState`) rather than wrapping them in React components.
- **Playwright API Seeding**: Use Firebase Admin SDK (pointed to Local Emulators) inside Playwright Fixtures to provision backend state instantly, bypassing multi-step UI wizards for generic test prerequisites.

## Risks/Trade-offs

- **Static Fixtures Maintenance**: Hardcoded JSON fixtures might drift if external LLM API schemas change suddenly (though they are generally stable).
- **Domain Isolation vs Cascading Context**: Hunting bugs domain-by-domain might miss cross-domain architectural side-effects unless RAG and Graph integrations are specifically targeted.
