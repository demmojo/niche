# Brainstorm: High-Impact Feature Video Generation

## What We're Building

A reliable, AI-verified pipeline to generate compelling feature demonstration videos for NicheAI's landing and product pages.

The previous Playwright-based recording approach resulted in videos that were either blank (due to modals intercepting clicks) or lacked meaningful interaction because precise timing and UI rendering states were difficult to synchronize.

We are shifting to an `agent-browser` based approach. Instead of continuous video recording, we will take high-quality screenshots at very specific, verified moments in the UI flow and stitch them together using `ffmpeg`. Crucially, we will implement an AI verification step to analyze the screenshots and confirm they contain the expected UI elements before finalizing the video.

## Why This Approach

1. **Precision**: Taking discrete screenshots after waiting for specific elements (using `agent-browser wait`) guarantees we capture the exact state we want, bypassing timing issues and animations.
2. **AI Verification**: Before stitching screenshots into a video, an AI agent can analyze the DOM snapshot (or the image itself) to ensure the "Get Started" modal isn't blocking the view, and the data has actually loaded.
3. **Smaller File Sizes**: A stitched video from 5-10 keyframes with simple transitions is often smaller and loops cleaner than a full WebM recording.

## Key Decisions

- **Tooling**: We will use `agent-browser` to navigate and take screenshots, and `ffmpeg` to stitch them.
- **Verification**: The generation script will include a step that uses the `gemini` API (or the `AskQuestion` tool in our workflow) to verify the contents of the screen before proceeding.
- **Focus**: The videos must be highly impactful. They shouldn't just show a button being clicked; they need to show the _result_ (e.g., the Mindmap actually rendering, the Sync Review modal showing a diff).

## Proposed Video Plans

### 1. Automated Market Intelligence

- **Step 1**: Screenshot of the "Background Tasks" tab, empty state or ready state.
- **Step 2**: Screenshot immediately after clicking "Run Discovery", showing the loading state.
- **Step 3**: (CRITICAL) Wait for the notification or the table to update. Screenshot showing the newly added "Threat" or "Funding" insight.

### 2. Visual Intelligence

- **Step 1**: Screenshot of the "Market Analysis" tab, showing the rendered D3 Mindmap.
- **Step 2**: The agent expands a node (e.g., clicks a Competitor to show Categories). Screenshot of the expanded mindmap.
- **Step 3**: Scroll down to the "Market Value Notebook". Screenshot showing a successful calculation cell.

### 3. Actionable Outputs (Documentation Wizard)

- **Step 1**: Screenshot of the "My Product" page.
- **Step 2**: Click "Generate Docs". Screenshot of the wizard modal opening.
- **Step 3**: Select options and click "Next". Screenshot of the final Markdown preview or the download confirmation.

### 4. Human-in-the-loop Trust (Data Sync Review)

- **Step 1**: The system must have a pending sync (we can mock this state if needed). Screenshot of the "Sync Pending Review" banner.
- **Step 2**: Click the banner. Screenshot of the `SyncReviewModal` showing a clear field-by-field diff.
- **Step 3**: The user accepts a change. Screenshot of the updated state.

### 5. Flexible AI Power (BYOK)

- **Step 1**: Screenshot of the "Settings" > "API Keys" section showing the custom key inputs.
- **Step 2**: Screenshot of the Model Priority selection, showing Claude/GPT/Gemini.
- **Step 3**: Screenshot of the real-time API Quota progress bars.

## Resolved Questions

- **Triggering Sync Review**: We will trigger a real, fast sync (e.g., using a small test domain like `example.com`) and wait for the "Sync Pending Review" banner to appear naturally.
- **Video Transitions**: The `ffmpeg` script will use crossfade transitions between screenshots for a smoother, more polished look.
