# Market Analysis Features

The `MarketAnalysis` component is being expanded to include a new "Data Grid & SWOT" view, alongside the existing "AI Chat" view. This addresses missing features from 8 skipped tests across `MarketAnalysis` and `MindmapExplorer`.

## Features

### 1. Tabbed Interface

- **Requirement:** A toggle to switch between the original "AI Chat" view and a new "Data & SWOT" view.

### 2. Competitor Data Table

- **Requirement:** A sortable, editable table displaying all competitors.

### 3. Column Toggling

- **Requirement:** A UI element to hide/show specific columns within the competitor data table.

### 4. Inline Editing

- **Requirement:** Clicking a cell in the competitor table allows inline editing of its value (e.g., name, description, features).
- **Requirement:** Edits are synced via `useFirebaseSync`.

### 5. Auto-SWOT Generation

- **Requirement:** A button within the new tab that triggers an AI prompt to generate a JSON-structured SWOT analysis.
- **Requirement:** The generated SWOT analysis is rendered visually (Strengths, Weaknesses, Opportunities, Threats cards).
- **Requirement:** The generated SWOT analysis is synced via `useFirebaseSync`.

## Scenarios

- **WHEN** user clicks the "Data & SWOT" tab
- **THEN** the chat interface is hidden and the competitor data table is shown.
- **WHEN** user edits a cell in the competitor table
- **THEN** the value is updated and synced to Firebase.
- **WHEN** user toggles a column visibility
- **THEN** the column is shown/hidden in the table.
- **WHEN** user clicks "Generate SWOT"
- **THEN** a new SWOT analysis is generated and rendered.
