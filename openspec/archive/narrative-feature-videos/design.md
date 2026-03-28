## Context

The previous automated video recording approach successfully dismissed modals and waited for elements, but instantaneous `.click()` events made the resulting videos unintelligible. The videos lacked a human-like cursor and a narrative flow. We need the videos to look like a professional screen recording of a real user discovering insights and utilizing the platform's features, but we want the reliability of an automated script.

## Goals / Non-Goals

**Goals:**

- Replace the red circle with a highly realistic macOS-style SVG cursor.
- Implement smooth, deliberate mouse movements using Playwright's `mouse.move(x, y, { steps: ... })`.
- Ensure each video tells a mini-story about the value of the feature, rather than just clicking randomly.
- Use the existing realistic mock data for "KageForm" to populate the videos, making the insights look valuable and specific.

**Non-Goals:**

- Do not add text overlays or captions directly into the video (we will rely on the UI to tell the story).
- Do not record real human sessions (we still need the automated reliability of Playwright).
- Do not stitch with `ffmpeg`. We will stick with Playwright's native `.webm` recording since it's perfectly smooth and captures transitions flawlessly.

## Decisions

**1. Realistic SVG Cursor**

- **Decision**: We will inject a custom `div` containing a standard macOS black/white SVG arrow cursor, styling it to follow `e.clientX` and `e.clientY`, and adding a `transform: scale(0.9)` on `mousedown`.
- **Rationale**: A real-looking cursor instantly increases the perceived quality of the video and makes it obvious to the viewer where to focus their attention.

**2. Narrative-Driven Automation**

- **Decision**: The script will incorporate deliberate "reading pauses" (1-2 seconds) before clicking, and use 15-30 `steps` in `mouse.move` to simulate a human reaching for a button.
- **Rationale**: Fast, robotic clicks are jarring. Adding pauses simulates a user reading an insight or considering an option.

**3. Granular Storytelling per Feature**

- **Decision**: Each of the 5 features will have a dedicated script block that strictly follows the narrative outlined in `spec.md` (e.g., for Data Sync Review, we will mock a pending sync diff in the `SyncQueue` or trigger a background task to generate one).

## Risks / Trade-offs

- **Risk: Timing issues** -> A smooth, slow movement to an element might fail if the element shifts unexpectedly (e.g., a toast notification appears and pushes it down).
- **Mitigation**: We will ensure we wait for the target element to be stable (`waitForSelector`) and re-evaluate its bounding box immediately before the slow `humanClick`.
