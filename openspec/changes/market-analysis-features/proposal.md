## Why

The `MarketAnalysis` view currently functions exclusively as an AI chat interface. However, users need the ability to view, sort, and edit raw competitor data alongside their analysis. Additionally, generating a formal SWOT matrix is a core capability expected in market analysis workflows.

## What Changes

We are introducing a tabbed interface within the `MarketAnalysis` component to separate the conversational AI ("Archivist Burt") from a new, robust "Data Grid" view. This data grid will support sorting, inline editing, and column toggling. We are also adding an "Auto-SWOT" generation feature that persists its results to the database.

## Capabilities

### New Capabilities

- `market-data-grid`: A sortable, toggleable table of competitor data.
- `inline-competitor-editing`: Edit competitor attributes directly within the `MarketAnalysis` data grid.
- `auto-swot-generation`: Trigger an AI-driven SWOT analysis that renders alongside the chat.
- `firebase-swot-persistence`: Save generated SWOTs and table edits to Firebase.

### Modified Capabilities

- `market-analysis-view`: Upgraded from a single chat view to a dual-tab layout (Chat vs. Data/SWOT).

## Impact

This will affect the `MarketAnalysis.tsx` component and require integration with `useFirebaseSync` to handle data persistence. It will also require updates to the test suite to validate the new data grid and SWOT features.
