## Why

The previous Playwright-based video recordings for the landing page resulted in mostly blank screens due to full-screen onboarding modals blocking interactions, and unpredictable React rendering states. The resulting videos were entirely white, showing zero functionality. NicheAI needs high-quality, impactful feature videos to demonstrate its value propositions on the marketing site. We need a reliable, step-by-step verified generation approach.

## What Changes

We are transitioning the feature video generation pipeline from continuous Playwright `WebM` recordings to an `agent-browser` (or Playwright screenshot) screenshot-stitching approach. The new pipeline will take discrete, verified screenshots at critical moments in the UI flow, and use `ffmpeg` to stitch them together into smooth MP4/WebM videos with crossfade transitions. A new verification step using `gemini` vision (or local validation) will ensure the screenshots actually contain the intended UI elements before finalizing the video.

## Capabilities

### New Capabilities

- `feature-video-generator`: A robust script (`scripts/generate_feature_videos.cjs`) that uses Playwright to navigate, dismiss modals, explicitly wait for targeted UI selectors (verifying content exists), take high-resolution screenshots, and use `ffmpeg` to stitch them into videos with crossfades.
- `ai-video-verification`: An automated step that checks the generated screenshots to ensure they are not blank or obscured by modals before they are stitched.

### Modified Capabilities

- `landing-page-master`: The `docs/landing-page-master.md` will be updated to point to the newly generated, highly-polished crossfade videos.

## Impact

- **`scripts/generate_feature_videos.cjs`**: Will be heavily rewritten to use a step-by-step screenshot and `ffmpeg` stitching approach rather than raw `.video().path()` recording.
- **`docs/landing-page-master.md`**: Video references will be verified.
