## 1. Project-Level Documentation & Diagrams

- [x] 1.1 Update `README.md` with current tech stack boundaries, environment variables, and a Troubleshooting/Local Setup section.
- [x] 1.2 Create `docs/architecture/001-context-bound-zustand.md` (ADR) including a Mermaid State Injection Flowchart.
- [x] 1.3 Create `docs/architecture/002-app-decomposition.md` (ADR) detailing the component boundaries.
- [x] 1.4 Add an AI Client Sequence Diagram showing the async data flow, retries, and state resolution.

## 2. In-App User Documentation & Dictionaries

- [x] 2.1 Refactor `src/content/dictionary.ts` into a type-safe functional dictionary. (Cancelled - Reverted to strings for stability during refactor)
- [x] 2.2 Update `src/components/GuidedTour.tsx` with completion state persistence and manual restart triggers.
- [x] 2.3 Update `src/components/SupportHelpPage.tsx` content, including offline state handling.
- [x] 2.4 Audit and update tooltips for touch/mobile accessibility and clarity.

## 3. Codebase JSDoc Implementation & Tooling

- [x] 3.1 Install and configure `eslint-plugin-jsdoc` to enforce documentation on exported hooks and stores.
- [x] 3.2 Add JSDoc to `src/store/visualKnowledgeStore.tsx` interfaces, explaining "why" and detailing side-effects.
- [x] 3.3 Add JSDoc to core hooks (`useFirebaseSync`, `useSyncQueue`, `useLocalStorage`), specifically including `@example` and `@throws` for offline/conflict states.
- [x] 3.4 Add JSDoc to AI and utility clients (`geminiClient.ts`, `aiClient.ts`), clearly outlining `@throws` for rate limits and timeouts.
