## Context

The application has undergone major architectural changes including moving away from a monolithic `App.tsx` and refactoring state management to use context-bound vanilla Zustand stores. The documentation needs to catch up to these changes to prevent knowledge silos and reduce onboarding friction for both developers and users. Mid-level architectural documentation (how and why things connect) is currently missing.

## Goals / Non-Goals

**Goals:**

- Ensure all user-facing documentation accurately reflects current app capabilities and handles edge cases (mobile, offline).
- Document complex code structures (e.g., custom hooks, store setup, AI clients) using standard JSDoc, emphasizing intent, side-effects, `@example`, and `@throws`.
- Create Architecture Decision Records (ADRs) for recent major refactors.
- Enforce documentation standards via ESLint.

**Non-Goals:**

- Changing existing features or business logic.
- Rewriting the entire UI text, except to migrate to a type-safe functional dictionary pattern.

## Decisions

**1. Semantic JSDoc over Type Duplication**

- **Decision**: Standardize on JSDoc for documenting components, hooks, and utilities. Focus on side effects, cleanup, examples, and errors, applying docs to interfaces/types rather than implementation where applicable.
- **Rationale**: TypeScript already handles type definitions; JSDoc should explain the "why", the side-effects, and usage examples.

**2. Type-Safe Functional Dictionaries**

- **Decision**: Refactor `dictionary.ts` to use type-safe functions instead of raw string interpolation.
- **Rationale**: Makes missing translations or variables a compile-time error, ensuring robustness.

**3. Architecture Decision Records (ADRs)**

- **Decision**: Use ADRs in a `docs/architecture/` folder instead of bloating the `README.md`.
- **Rationale**: Preserves the historical context of architectural shifts (like moving to Context-Bound Zustand).

**4. Linting for Documentation**

- **Decision**: Add `eslint-plugin-jsdoc`.
- **Rationale**: Prevents documentation drift by failing builds if required exports lack documentation.

## Risks / Trade-offs

- **Risk: Documentation Drift** -> Documentation might quickly become outdated if the codebase changes rapidly.
- **Mitigation**: Enforced by `eslint-plugin-jsdoc` and incorporating documentation updates into the PR review process.
