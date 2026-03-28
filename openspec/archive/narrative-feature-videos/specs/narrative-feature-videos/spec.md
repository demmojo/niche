# Narrative Feature Videos

The goal is to generate high-impact, professional marketing videos from the `scripts/generate_feature_videos.cjs` script. The new script will use a realistic macOS-style cursor and simulate organic, human-like user actions to tell a compelling story about each feature.

## Features

### 1. The Narrative Script Engine

- **Requirement:** A `humanClick(page, locator)` function must calculate the bounding box, smoothly move the cursor to the center using 20-30 `steps`, pause to simulate reading (500ms-1500ms), and then execute a physical `mousedown` and `mouseup` to trigger the SVG cursor's native click animation.
- **Requirement:** The cursor injected into the page must be an SVG arrow that looks native and realistic (black with a white outline and drop shadow).

## Scenarios

The script implements 5 specific scenarios (videos), each with a step-by-step narrative.

### 1. Automated Market Intelligence

- **WHEN** the user is on the Dashboard
- **THEN** they smoothly navigate to "Raw Data" -> "Background Tasks".
- **THEN** they pause, then click "Run Discovery".
- **THEN** they watch the progress bar and logs populate with realistic Exa/Gemini tasks.
- **THEN** the video ends when the background tasks complete or surface a new insight.

### 2. Visual Intelligence

- **WHEN** the user is on the Dashboard
- **THEN** they navigate to "Market Analysis".
- **THEN** they pause to view the loaded D3 mind map.
- **THEN** they smoothly move the cursor and click on a competitor node (e.g., "Typeform") to expand it.
- **THEN** they scroll down to the "Market Value Notebook".
- **THEN** they click a cell to calculate the real-time market value and observe the output.

### 3. Actionable Outputs (Documentation Wizard)

- **WHEN** the user is on the "My Product" page
- **THEN** they pause to review their product details.
- **THEN** they click "Generate Docs".
- **THEN** the Documentation Wizard modal opens.
- **THEN** they select "Product Requirements Document (PRD)" and a few features.
- **THEN** they click "Generate" and the video concludes with the markdown preview or download success state.

### 4. Human-in-the-loop Trust (Data Sync Review)

- **WHEN** the global "Sync Pending Review" banner is visible on the screen
- **THEN** they smoothly move to the banner and click it.
- **THEN** the Sync Review modal opens, showing a side-by-side diff.
- **THEN** they scroll through the diff, pause on a significant change (e.g., Target Audience).
- **THEN** they click "Accept" for that specific change.
- **THEN** they click "Accept Selected & Close".
- **THEN** the modal closes, revealing the updated Competitor Matrix.

### 5. Flexible AI Power (BYOK)

- **WHEN** the user is on the "Settings" page
- **THEN** they click on the "API Keys" section.
- **THEN** they pause to show the input fields for OpenAI/Anthropic keys.
- **THEN** they scroll to the "Model Priority" section.
- **THEN** they interact with the dropdown/drag-and-drop to make Claude 3.5 Sonnet the Primary model.
- **THEN** they scroll down to hover over the API Quotas progress bars to view real-time limits.
