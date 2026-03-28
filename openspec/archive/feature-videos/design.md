## Context

The previous automated video recording approach using Playwright's native `recordVideo` feature produced blank (white) videos. This occurred because React applications render asynchronously, and NicheAI has full-screen `z-[100]` onboarding modals (e.g., `PageGuideModal`) that intercept clicks and obscure the main UI. Since Playwright started recording immediately, it captured the blank or blurred state before the application finished loading and before the script could dismiss the modals.

## Goals / Non-Goals

**Goals:**

- Guarantee that feature videos accurately and clearly demonstrate the intended UI and functionality.
- Implement a reliable screenshot-based pipeline with explicit DOM validation before capturing frames.
- Stitch screenshots together using `ffmpeg` with smooth crossfade transitions for professional-looking feature demos.
- Verify the contents of the screen (e.g., ensuring a D3 chart actually rendered) before capturing the image.

**Non-Goals:**

- Do not rely on continuous native video recording (which is brittle to rendering delays and modal popups).
- Do not build a complex real-time AI computer vision agent to navigate the site; stick to reliable DOM selectors (`data-testid`, text matching) for navigation.

## Decisions

**1. Screenshot and Stitch Pipeline**

- **Decision**: We will replace `browser.newContext({ recordVideo: ... })` with an explicit sequence of `page.screenshot()` calls at key moments, followed by an `ffmpeg` command that stitches them into a video.
- **Rationale**: Taking discrete screenshots allows the script to explicitly wait for `networkidle`, dismiss all modals, wait for specific UI elements to appear (e.g., the mindmap SVG), and take a perfect high-res image.

**2. Video Transitions**

- **Decision**: The `ffmpeg` script will use the `xfade` filter to crossfade between the screenshots for a smoother, more polished look.
- **Rationale**: Hard cuts between static screenshots can feel disjointed. Crossfades simulate the passage of time (e.g., between "loading" and "results") elegantly.

**3. Triggering Sync Review**

- **Decision**: To demonstrate the "Sync Pending Review" banner naturally, we will trigger a real, fast sync (e.g., running discovery on a small test domain) and wait for the banner to appear.
- **Rationale**: Mocking the backend state is fragile and doesn't test the actual data flow. A real sync ensures the diff modal shows real data.

## Risks / Trade-offs

- **Risk: `ffmpeg` complexity** -> The `ffmpeg` command to apply crossfades across multiple dynamic images can be complex and error-prone.
- **Mitigation**: We will construct a clear, well-commented Node.js script that builds the `ffmpeg` filter graph dynamically based on the number of screenshots taken for a feature.
