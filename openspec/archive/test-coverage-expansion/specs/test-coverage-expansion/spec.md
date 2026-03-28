# Test Coverage Expansion

This plan outlines how to increase global function coverage to >80%, focusing heavily on the recently added Visual Whiteboard components which currently have <40% coverage.

## Features

### 1. `visualKnowledgeStore` Tests

- **Requirement:** Create tests for store creation, card/whiteboard/edge CRUD operations, ensuring instances are removed globally when cards are deleted.

### 2. `CustomCardNode` Tests

- **Requirement:** Mount with mocked Zustand store. Verify background styling corresponds to card `type`. Verify tag addition/deletion.

### 3. `MindmapAIChat` Tests

- **Requirement:** Mount with mocked `geminiClient`. Verify mentioning cards with `@` and pinning AI responses to the board.

### 4. `DocumentationWizardModal` Expanded Tests

- **Requirement:** Check/uncheck specific insights, select different templates, test the "Download Document" button functionality, and handle AI generation failures.

### 5. Remaining UI Modals Tests

- **Requirement:** Add tests for `GuidedTour`, `InviteMemberModal`, and `RequestAccessModal`, mocking `firebase/firestore`.

## Scenarios

- **WHEN** user requests a test suite expansion
- **THEN** all coverage metrics (Functions, Branches, Statements, Lines) exceed the 80% global threshold.
