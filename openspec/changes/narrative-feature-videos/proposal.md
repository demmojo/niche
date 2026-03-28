## Why

The previous feature videos, while successfully recorded, lacked a human-like narrative. They instantly teleported around the UI, resulting in jarring and confusing videos that failed to demonstrate the real value proposition of NicheAI to potential users.

To improve the marketing impact of the videos, we need to introduce a realistic, visible mouse cursor (like the standard macOS arrow) that moves smoothly, hovers intentionally, and "clicks" gracefully to simulate a real user discovering insights and utilizing the platform's features. We must also ensure the mock data inside the app looks realistic and compelling for these recorded sessions.

## What Changes

We are upgrading `scripts/generate_feature_videos.cjs` to inject a highly-realistic, animated macOS-style SVG cursor. We will rewrite the script for the 5 core features to follow a structured, step-by-step narrative where the cursor moves smoothly (using multi-step interpolations), pauses to let the viewer read, and interacts with rich, realistic mock data (already present via `KageForm` mock data).

## Capabilities

### New Capabilities

- `realistic-cursor-injection`: A utility injected into the Playwright page that overlays an SVG arrow cursor that smoothly follows X/Y coordinates and shrinks slightly on click to simulate a mouse press.
- `narrative-video-orchestrator`: A set of functions (`humanMove`, `humanClick`, `readingPause`) that create organic, bezier-like or staggered mouse movements and deliberate timing.

### Modified Capabilities

- `feature-video-generator`: The 5 feature recording flows are completely rewritten to follow specific, high-value narratives (e.g., clicking a D3 mindmap node to expand it, clicking through the Doc Wizard modal sequentially).

## Impact

- **`scripts/generate_feature_videos.cjs`**: Will be heavily modified to use the new `humanClick` and `humanMove` helpers, with extended waits for smooth, narrative-driven pacing. The videos produced will be suitable for top-tier product marketing.
