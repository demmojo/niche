# Strategy Toolbox

Detailed specification for the Strategy Toolbox feature, enabling dynamic product strategy analysis.

## Features

### 1. Strategy Toolbox Hub

- **Requirement:** Display a grid of available tools with their descriptions, badges, and data lineage.
- **Requirement:** Allow users to search and select a specific tool.

### 2. Toolbox Engine

- **Requirement:** Wrap each tool with a standard header and a Methodology Sidebar explaining "Why use this?" and "Data Source".
- **Requirement:** Provide action buttons to "Generate Experiment" and "Generate Blueprint".

### 3. External Signals Sync Job

- **Requirement:** Sync Competitor Sentiment using Exa API to find negative reviews and complaints.
- **Requirement:** Sync Market Intent (JTBD) using Exa API to find forum discussions (Reddit/Quora) about workarounds and alternatives.

## Scenarios

- **WHEN** the user opens the Strategy Toolbox
- **THEN** they should see a list of 5 early-stage analytical tools.

- **WHEN** the user selects the "JTBD Opportunity Landscape"
- **THEN** the Toolbox Engine should render the tool, showing data sourced via the `ExternalSignalsSyncJob` from Exa API.
