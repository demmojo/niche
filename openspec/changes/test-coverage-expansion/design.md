## Context

The test suite coverage has dropped below the 80% threshold following the addition of complex new features like the infinite canvas whiteboard (`VisualWhiteboard`), the underlying Zustand store (`useVisualKnowledgeStore`), and several modal interactions.

## Goals / Non-Goals

**Goals:**

- Increase global function coverage to >80%.
- Ensure robust unit testing for the new Zustand store `visualKnowledgeStore`.
- Test complex UI components like `CustomCardNode` and `MindmapAIChat`.
- Add tests for missing utility modals (`GuidedTour`, `InviteMemberModal`, `RequestAccessModal`).
- Expand coverage for `DocumentationWizardModal`.

**Non-Goals:**

- Attaining 100% coverage globally (diminishing returns on simple UI logic).
- End-to-End (E2E) testing (Playwright coverage is managed separately).

## Decisions

**1. Testing the Zustand Store Directly**

- **Decision**: Write tests specifically for `visualKnowledgeStore` operations (CRUD for cards, whiteboards, edges).
- **Rationale**: Isolating state logic ensures the core data foundation is solid before testing UI.

**2. Component Level Mocks**

- **Decision**: Mock heavy external dependencies (Firebase, Gemini API, React Flow) during component testing.
- **Rationale**: Keeps tests fast, isolated, and focused on component logic (e.g., tag addition, chat mentions) rather than network/library integrations.

## Risks / Trade-offs

- **Risk: Brittle Tests** -> Highly complex UI interactions (like drag-and-drop or canvas manipulations) are notoriously difficult to unit test cleanly.
- **Mitigation**: Focus unit tests on logic (e.g., store state changes, conditional rendering, mention parsing) and leave visual layout/canvas interactions to Playwright E2E tests.
