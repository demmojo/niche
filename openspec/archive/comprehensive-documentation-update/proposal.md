## Why

As the codebase has evolved with significant architectural changes (like the recent performance optimization and component extraction), the documentation, both in-code and user-facing (in-app), needs to be updated. It must be accurate, seamless, intuitive, effective, and comprehensive to ensure easy onboarding for new developers and clear understanding for users.

## What Changes

- **In-App Documentation Update**: Update in-app guides, tooltips, onboarding modals, and help pages to reflect the current feature set and UI changes. Handle mobile/touch cases and empty/error states.
- **Codebase Documentation Update**: Add JSDoc comments to core hooks, utilities, and components focusing on side-effects, examples, and error handling (`@throws`). Update `README.md` and create Architecture Decision Records (ADRs) and Mermaid diagrams to reflect the recent context-bound Zustand store, Vite chunking, and extracted components.
- **Content Dictionary Review**: Refactor `dictionary.ts` into a type-safe functional dictionary to ensure UI copy is centralized and compile-time safe.
- **Linting Enforcement**: Introduce ESLint rules (`eslint-plugin-jsdoc`) to prevent documentation drift.

## Capabilities

### Modified Capabilities

- `developer-experience`: Improved through accurate and comprehensive codebase documentation, ADRs, architectural diagrams, and enforced linting.
- `user-experience`: Enhanced through intuitive, accurate in-app documentation, mobile-friendly tooltips, and resilient guides.

## Impact

This will touch in-app help components (like `SupportHelpPage`, `GuidedTour`, `DocumentationWizardModal`, tooltips) and core codebase files (for adding JSDoc comments), as well as project-level markdown documentation (`README.md`, `docs/architecture/`, etc.) and ESLint configurations.
