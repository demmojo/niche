## Why

> **NOTICE:** This spec has been **superseded** by `analytical-template-system`.

The current analytics offerings in NicheAI lack the visual fidelity ("wow factor") and flexible reporting capabilities required by executives and power users. Furthermore, as data scales, manual curation of features and market signals becomes a bottleneck. We need a system that not only looks stunning but actively learns and deduplicates data to ensure high-signal insights.

## What Changes

We are introducing the **Next-Gen Analytics Platform**. This replaces static data views with a dynamic, "Triple-Mode Smart Compose" reporting canvas backed by an autonomous, self-learning data pipeline. It deeply integrates with the Lens Strategy Console to turn data observation into actionable product evolution.

## Capabilities

### New Capabilities

- `self-learning-pipeline`: Autonomous backend system using vector embeddings to deduplicate data and intelligently group features by market scope.
- `triple-mode-reporting`: A unified canvas allowing report creation via Pre-built Templates, Freeform Drag & Drop, or Smart AI Layouts.
- `multi-format-export`: High-fidelity export of charts and custom tables to Spreadsheet, Image (PNG/SVG), and PDF.
- `lens-analytics-integration`: Contextual hand-off from analytics dashboards directly to the Lens Strategy Console, and bi-directional state synchronization.
- `chat-to-chart`: Context-aware AI chat scoped exclusively to the currently viewed table or chart for deep-dive analysis.

### Modified Capabilities

- `data-grids`: Upgraded to support advanced cross-attribute comparison (sectors, revenue, markets) with smart filtering that only allows compatible attributes to be added.

## Impact

- **Frontend:** Major overhaul of data visualization components (introducing advanced charting libraries, drag-and-drop canvas, and PDF/Image export utilities).
- **Backend/Data:** Introduction of vector embeddings (e.g., `pgvector`) and background worker queues for the self-learning deduplication pipeline.
- **AI Services:** Expansion of the AI context window strategies to support template-aware data interpretation and "Chat-to-Chart" functionality.
