# Comprehensive Documentation Update

## Features

### 1. In-App Documentation

- **Requirement:** Update the `SupportHelpPage` and `GuidedTour` to reflect the latest UI layout and features, including state persistence (has_seen_tour).
- **Requirement:** Review tooltips across the app (e.g., `InsightEngineChat`, `VisualWhiteboard`) for clarity, accuracy, and accessibility on touch/mobile devices.
- **Requirement:** Ensure offline and error states are handled gracefully in help documentation.

### 2. Codebase Documentation

- **Requirement:** Add JSDoc comments to core state management interfaces (e.g., `visualKnowledgeStore.tsx`).
- **Requirement:** Add JSDoc comments to core hooks (e.g., `useFirebaseSync.ts`) and AI clients detailing `@throws`, rate limits, and offline fallback strategies.
- **Requirement:** Update `README.md` to document the state management boundaries, folder structure, environment variables, and local troubleshooting.
- **Requirement:** Create ADRs and Mermaid diagrams (State Injection Flowchart, AI Client Sequence Diagram).

### 3. Tooling

- **Requirement:** Add `eslint-plugin-jsdoc` to enforce documentation standards.
- **Requirement:** Migrate `dictionary.ts` to a type-safe functional dictionary pattern.

## Scenarios

- **WHEN** a developer hovers over `useVisualKnowledgeStore`
- **THEN** they see a clear JSDoc explanation of the state interface and side-effects, rather than redundant type definitions.

- **WHEN** a developer implements an AI Client or `useFirebaseSync`
- **THEN** the JSDoc explicitly lists `@throws` detailing rate limit, timeout, or permission errors.

- **WHEN** a new user logs in for the first time
- **THEN** the `GuidedTour` starts automatically, AND their progress/dismissal is saved to their profile so it doesn't reappear on next login.

- **WHEN** a user accidentally dismisses the `GuidedTour`
- **THEN** they can manually restart it from a clearly visible button on the `SupportHelpPage`.

- **WHEN** the application is entirely offline
- **THEN** the `SupportHelpPage` displays a cached, read-only version of the core FAQs with a banner indicating offline status.

- **WHEN** a user accesses the app on a touch device
- **THEN** tooltips are accessible via a long-press or adjacent "info" icon, ensuring mobile feature discovery.
