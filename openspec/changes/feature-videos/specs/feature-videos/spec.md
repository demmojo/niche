# Feature Videos Regeneration & Verification

We are overhauling the feature video generation script to ensure they are high-impact, completely visible, and professionally edited with crossfades. The current Playwright recording captures blank screens due to React's asynchronous rendering and `z-[100]` onboarding modals.

## Features

### 1. `scripts/generate_feature_videos.cjs` (The Screenshot-Stitching Pipeline)

- **Requirement:**
  1. The script uses Playwright to navigate the application (`?mock_auth=true`) and explicitly wait for `#root` and `networkidle`.
  2. It contains a robust `dismissModals` function that finds and clicks "Get Started" and "Got it" buttons.
  3. Instead of `browser.newContext({ recordVideo: ... })`, the script executes a structured series of `page.screenshot({ path: ... })` calls for each feature.
  4. Before taking any screenshot, the script _must_ verify a specific, unique element is visible (e.g., `<svg>` for Mindmap, or `table` for Data Sync Review) to ensure the UI is fully rendered and not obscured by a white screen.
  5. The script generates 3-4 screenshots per feature and stores them temporarily.
  6. The script uses `child_process.execSync` to run `ffmpeg`, dynamically building a complex filter graph (`-vf`) to apply crossfades (`xfade`) between the screenshots, resulting in a smooth `.webm` video for each feature.
  7. The final videos are saved to `public/videos/`.

### 2. The 5 Specific Feature Video Flows

**A. Automated Market Intelligence**

- Navigate to "Raw Data" -> "Background Tasks".
- _Screenshot 1_: Empty state or ready state of the discovery button.
- Click "Run Discovery".
- _Screenshot 2_: Wait for the loading spinner or processing state.
- _Screenshot 3_: Wait for a new notification or log entry to appear indicating the background task finished.

**B. Visual Intelligence**

- Navigate to "Market Analysis".
- _Screenshot 1_: Wait for the D3 `<svg>` element to render the mindmap.
- Click a Competitor node to expand it.
- _Screenshot 2_: The expanded mindmap.
- Scroll to the "Market Value Notebook".
- _Screenshot 3_: The successful calculation cell output.

**C. Actionable Outputs**

- Navigate to "My Product".
- _Screenshot 1_: The initial product page.
- Click "Generate Docs" (or "Generate OpenSpec").
- _Screenshot 2_: The Documentation Wizard modal appears.
- Click "Next".
- _Screenshot 3_: The preview or download confirmation step.

**D. Human-in-the-loop Trust**

- _Step 1_: Trigger a fast, real "Run Discovery" sync. Wait for it to finish.
- _Screenshot 1_: The "Sync Pending Review" global banner.
- Click the banner.
- _Screenshot 2_: The `SyncReviewModal` showing a clear field-by-field diff.
- _Screenshot 3_: After accepting a change, the updated state.

**E. Flexible AI Power**

- Navigate to "Settings" -> "API Keys".
- _Screenshot 1_: The custom key inputs for OpenAI/Anthropic/Gemini.
- _Screenshot 2_: The Model Priority drag-and-drop or selection area.
- Scroll down.
- _Screenshot 3_: The real-time API Quota progress bars (Apollo/Exa/Gemini).

## Scenarios

- **WHEN** the `node scripts/generate_feature_videos.cjs` command is run
- **THEN** it navigates the UI, dismisses modals, captures sequential screenshots when the UI is confirmed visible, stitches them with `ffmpeg` crossfades, and outputs 5 highly-impactful `.webm` videos into `public/videos/`.
