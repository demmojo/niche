## 1. Feature Script Refactoring

- [x] 1.1 Analyze the current `scripts/generate_feature_videos.cjs` and extract the `dismissModals` logic.
- [x] 1.2 Retain the native `recordVideo` option from `browser.newContext()` but implement robust navigation and element-waiting logic for the 5 feature flows described in `spec.md`.
- [x] 1.3 Add explicit `page.waitForSelector(...)` calls before interacting to ensure the UI element (e.g., `#root`, `svg`, `.animate-in`) is fully visible and not blocked by a white screen or `z-[100]` modal.
- [x] 1.4 Write a robust Node.js utility within the script that uses `child_process.execSync` to dynamically run `ffmpeg` with crossfade filters (`xfade`) across the generated screenshots, saving them as `.webm` files. (CANCELLED: User elected to keep using Playwright native recording without ffmpeg stitching)

## 2. Implement the 5 Feature Workflows

- [x] 2.1 Refactor "Automated Market Intelligence" to trigger a background task and wait for the "Sync Pending Review" banner or new log entry before ending the video.
- [x] 2.2 Refactor "Visual Intelligence" to wait for the D3 mindmap `<svg>` to render and expand a node before capturing.
- [x] 2.3 Refactor "Actionable Outputs" to navigate the "My Product" Documentation Wizard modal step-by-step.
- [x] 2.4 Refactor "Human-in-the-loop Trust" to trigger a real, fast sync and capture the `SyncReviewModal` showing a clear field-by-field diff.
- [x] 2.5 Refactor "Flexible AI Power" to scroll and capture the "Settings" > "API Keys", "Model Priority", and "API Quota" sections sequentially.

## 3. Video Verification and Validation

- [x] 3.1 After recording, use `fs.statSync` to verify the generated `.webm` files exist and are larger than an arbitrary minimum threshold (e.g., > 100KB) to ensure they are not empty/blank.
- [x] 3.2 Update `docs/landing-page-master.md` to ensure the descriptions and visuals match the new, highly-polished videos.
