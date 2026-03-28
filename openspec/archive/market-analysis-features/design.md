## Context

The `MarketAnalysis` component currently functions as an AI chat interface ("Archivist Burt"). However, 8 skipped tests across `MarketAnalysis` and `MindmapExplorer` expect features like a sortable competitor data table, column toggling, inline editing, SWOT generation, and Firebase saving. To implement these without cluttering the chat UX, we're introducing a tabbed interface.

## Goals / Non-Goals

**Goals:**

- Implement a sortable, editable competitor data table within `MarketAnalysis`.
- Allow column toggling within this table.
- Implement an "Auto-SWOT" generation feature.
- Use `useFirebaseSync` to persist these edits and generated SWOTs.
- Pass the currently skipped tests in `MarketAnalysis.test.tsx`.

**Non-Goals:**

- Completely rewriting the `MarketAnalysis` chat interface.
- Changing the primary function of the component.

## Decisions

**1. Tabbed Interface**

- **Decision**: We will introduce a top-level tab toggle (e.g., "Chat" | "Data & SWOT") within `MarketAnalysis.tsx`.
- **Rationale**: This keeps the primary chat UX clean while providing a dedicated space for the complex data grid and SWOT matrix.

**2. Reusing DataPointsTable Patterns**

- **Decision**: We will adapt or reuse logic from `DataPointsTable.tsx` for the new grid.
- **Rationale**: Consistency and code reuse. However, `MarketAnalysis` specifically requires inline editing and column toggling.

**3. Auto-SWOT Generation**

- **Decision**: We will add a button that triggers a specific Gemini prompt to generate a JSON-structured SWOT, which is then rendered visually.
- **Rationale**: This provides a structured, exportable artifact rather than just a conversational chat reply.

## Risks / Trade-offs

- **Risk: Component Bloat** -> `MarketAnalysis` is already large; adding a complex data grid and SWOT generator will increase its size.
- **Mitigation**: We will try to extract subcomponents (like the Data Grid or SWOT Grid) into separate files if possible, or at least keep the render functions clean.
