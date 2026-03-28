## 1. State & Migration

- [x] 1.1 Define TypeScript interfaces for the normalized `Card`, `Whiteboard`, and `Edge` structures.
- [x] 1.2 Implement a migration function to convert existing D3 tree state to the new flattened format.
- [x] 1.3 Create the `useWhiteboardStore` (via Context or LocalStorage) to manage multiple boards and the global card library.

## 2. Canvas UI Integration

- [x] 2.1 Install `@xyflow/react` and remove `d3.tree` dependencies in `MindmapExplorer`.
- [x] 2.2 Build custom React Flow node components for the different card types (Note, Competitor, Insight).
- [x] 2.3 Implement whiteboard switching UI (sidebar or tabs).

## 3. Template System

- [x] 3.1 Define JSON definitions for the 10 templates (Node positions, default titles, edges).
- [x] 3.2 Build the "Create Whiteboard" modal with template selection.

## 4. AI Chat Integration

- [x] 4.1 Build the `MindmapAIChat` side-panel component.
- [x] 4.2 Implement the `@mention` autocomplete parser for tags and cards.
- [x] 4.3 Update `geminiClient` integration to accept the injected contextual node content.
- [x] 4.4 Implement the "Pin to Board" action to create a new card from an AI response.

## 5. Documentation & Polish

- [x] 5.1 Update tests for the new `useWhiteboardStore`.
- [x] 5.2 Add in-app tooltip guides for the bi-directional linking and AI `@mention` features.
- [x] 5.3 Generate feature video for the landing page.
