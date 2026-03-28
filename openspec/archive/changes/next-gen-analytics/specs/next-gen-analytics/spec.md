# Next-Gen Analytics Platform

This specification details the architecture, data models, and user flows for the NicheAI Analytics platform overhaul, focusing on the autonomous self-learning data pipeline and the "Triple-Mode Smart Compose" reporting interface.

## Features

### 1. Autonomous Self-Learning Data Pipeline

- **Requirement:** A backend service (running asynchronously) that continuously evaluates incoming market data (features, news, signals). It generates vector embeddings (`text-embedding-3-small` or equivalent) and uses cosine similarity (via `pgvector`) to identify and group duplicates or highly similar concepts based on a defined market/regional scope. High-confidence matches are automatically grouped under a canonical "parent" feature, reducing noise in the UI.

### 2. Triple-Mode Reporting Canvas

- **Requirement:** A React-based, interactive dashboard that supports three modes:
  1.  **Templates:** Pre-built, professional layouts (e.g., Pricing Matrix, Capability Gap).
  2.  **Freeform:** A drag-and-drop grid where users can place charts, tables, and text blocks.
  3.  **Smart Layout:** AI analyzes the selected data dimensions and suggests an optimal arrangement.

### 3. Smart Custom Tables with Cross-Attribute Comparison

- **Requirement:** Data grids (powered by TanStack Table) that allow comparison across sectors, revenue ranges, markets, and regions. The UI must be intelligent: when adding a new column/dimension, it must filter available options to only show attributes semantically compatible with the existing data.

### 4. High-Fidelity Multi-Format Export

- **Requirement:** The ability to export the current canvas or table to:
  - Spreadsheet (CSV/XLSX)
  - Image (PNG/SVG, ensuring high-res typography)
  - PDF (using a robust library like `react-pdf` to ensure layout fidelity).

### 5. Lens Strategy Console Integration & Chat-to-Chart

- **Requirement:** A "Send to Lens" button on analytics views that passes the current data context (filters, market scope, selected metrics) to the Lens Strategy Console. Additionally, a contextual chat interface scoped specifically to the currently viewed table/chart, allowing users to ask natural language questions about the visualized data ("Why did the adoption rate dip?").

### 6. Interactive Spotlight Onboarding

- **Requirement:** A modern, dismissible onboarding wizard that guides new users through the Triple-Mode reporting capabilities using spotlighting/tour techniques.

## Scenarios

- **WHEN** the background sync engine ingests a new competitor feature that is semantically identical (confidence > 0.95) to an existing feature in the same market scope, **THEN** the self-learning pipeline automatically merges it as a sub-feature or reference to the canonical parent, preventing duplicate entries in the Analytics tables.
- **WHEN** a user selects "Smart Layout" on the reporting canvas after selecting three competitor datasets and a revenue dimension, **THEN** the AI evaluates the data and automatically arranges a bar chart, a comparison table, and an executive summary text block in an optimized, presentation-ready layout.
- **WHEN** a user clicks "Export to PDF" on a complex Freeform canvas, **THEN** the system generates a high-fidelity, paginated PDF document that perfectly preserves the modern typography, chart SVGs, and layout structure.
- **WHEN** a user clicks "Send to Lens" while viewing a specific Capability Gap table, **THEN** the Lens Strategy Console opens with the table's specific context pre-loaded, ready to answer questions or draft strategic recommendations based on that exact data slice.
