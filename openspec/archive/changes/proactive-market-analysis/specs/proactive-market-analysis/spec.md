# Proactive Market Analysis

## Features

### 1. Sync State Awareness

- **Requirement:** If no sync has been done (empty stats/competitors), prompt the user to sync before analyzing.
- **Requirement:** While syncing, display a non-blocking progress banner indicating the current action (e.g., Grounding, AI analysis).
- **Requirement:** Allow the user to continue chatting with existing raw data while the sync runs.

### 2. Data Freshness Indicator

- **Requirement:** Display the date and time the market data was last pulled.
- **Requirement:** Clearly indicate whether the data is fresh or stale using visual cues.

### 3. Proactive Insight Generator

- **Requirement:** When a background deep analysis completes, surface a subtle notification (chip/popup).
- **Requirement:** After the user interacts with or cancels the insight flow, Burt should ask if they want to explore the newly pulled intelligence.

### 4. Modern UX & Inline Actions

- **Requirement:** Render inline buttons on AI responses to instantly generate/save features and insights.
- **Requirement:** Route market analysis requests to Pro models by default to ensure high-quality reasoning.

## Scenarios

- **WHEN** the user visits Market Analysis and no sync has ever occurred
- **THEN** the system prompts them to run a sync before starting the analysis.

- **WHEN** a sync is triggered
- **THEN** a banner appears showing the current stage, but the chat input remains active.

- **WHEN** deep analysis completes in the background
- **THEN** an insight generator popup/chip appears, and Burt follows up asking to explore the new data.
