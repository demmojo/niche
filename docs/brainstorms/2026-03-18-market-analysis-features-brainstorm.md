# Brainstorm: Market Analysis & Mindmap Features (Test Alignment)

## What We're Building

We need to implement a suite of missing features within the `MarketAnalysis` and `MindmapExplorer` components to satisfy 8 pending tests and enhance user capabilities in alignment with the project's modern architecture.

1.  **MarketAnalysis - Competitor Data Table**: A sortable, tabbed table rendering competitor data directly within the Market Analysis view.
2.  **MarketAnalysis - Column Toggling**: The ability to show/hide columns within this new table.
3.  **MarketAnalysis - Inline Editing**: The ability to edit cells directly within the competitor table.
4.  **MarketAnalysis - Auto-SWOT Generation**: A dedicated feature to generate a Strengths, Weaknesses, Opportunities, and Threats (SWOT) analysis.
5.  **MarketAnalysis - Firebase Persistence**: Integrating `useFirebaseSync` to save these edits and generated SWOT analyses to the database.
6.  **MindmapExplorer - React Flow Migration**: Instead of the skipped D3 force graph test, we will implement the `multiple-visual-whiteboards` OpenSpec (which migrates the Mindmap to a modern `@xyflow/react` infinite canvas).
7.  **MindmapExplorer - Filtering & Searching**: Adding text search and category filtering to the new React Flow canvas to satisfy the remaining skipped tests.

## Why This Approach

The user requested to implement the missing features from 8 skipped tests by applying OpenSpec proposals.

For `MarketAnalysis`, since it currently functions primarily as a chat interface ("Archivist Burt"), we are opting to build these data-grid capabilities into a dedicated tab to avoid cluttering the chat UX. This requires a new OpenSpec proposal.

For `MindmapExplorer`, the existing `multiple-visual-whiteboards` OpenSpec dictates moving away from D3.js to React Flow. Therefore, we will align the tests to expect the modern architecture (React Flow) rather than blindly implementing an outdated D3 force graph just to pass the literal wording of the old test.

## Key Decisions

- **Data Grid Integration**: We will introduce a complex data grid (likely leveraging or expanding upon the existing `DataPointsTable` patterns) into a separate tab within the `MarketAnalysis` view.
- **SWOT Generation**: We will implement a distinct UI element within the new `MarketAnalysis` tab that triggers an AI prompt specifically formatted to return a SWOT analysis structure, rendering alongside the chat.
- **Persistence**: We will wire up the `useFirebaseSync` hook to ensure all manual edits to the table and generated SWOT data are saved to the backend.
- **Modernizing Tests**: We will rewrite the 3 skipped `MindmapExplorer` tests to assert the presence of React Flow nodes/edges, search inputs, and filter controls, rather than D3 SVGs.

## Resolved Questions

- **Integration of Data Table**: We will use a separate tab toggle within the `MarketAnalysis` component to switch between the Chat Interface and the Data Grid/SWOT Analysis view.
- **Auto-SWOT Presentation**: The SWOT generation will exist alongside the chat as a persistent, dedicated artifact/panel within the new tab.

## Open Questions

- None.
