# Brainstorm: Global Progress Banner for Long-Running Tasks

**Date**: 2026-03-18
**Author**: Assistant
**Status**: Resolved, Refined

## What We're Building

A seamless, beautiful UX/UI design pattern to keep the user informed during long-running background operations (e.g., Global Sync, Data Pipelines).
We are implementing a **Floating Sticky Header Banner** that drops down from the top edge of the screen to explicitly communicate the current step of a multi-stage background process.

## Key Requirements

- Must display step-by-step progress visually based on the global `activeTasks` array.
- Located as a slim progress banner fixed at the very top of the screen (`z-50` or higher).
- Auto-hides after a short delay (e.g., 3-5 seconds) once all tasks reach 100%.
- Must handle multiple tasks gracefully by calculating overall percentage.

## Why This Approach (Floating Sticky Header Banner)

- **High Visibility**: Users often navigate away from the "Background Tasks & Sync" tab while waiting. A global sticky banner ensures they remain aware of the system's state regardless of their current view.
- **Clear Communication**: Explicitly stating the current step (e.g., "Step 2 of 7: Analyzing market trends") reduces anxiety during a 20-45s wait.
- **Smooth Animation**: Using Framer Motion for slide-in/slide-out effects provides a premium, polished feel.

## Key Decisions

- **Location**: Absolute/Fixed top of the screen, just below or overlapping the main navigation bar.
- **Completion Behavior**: Auto-hide after 3000ms once `activeTasks.every(t => t.progress === 100)` is true. During this 3s window, the banner should turn green to indicate success.
- **State Integration**: Instead of a new context, the banner will plug directly into the existing `activeTasks` state in `App.tsx` which tracks steps like "Scraping competitor pricing" and "Generating strategic insights".

## Resolved Questions

- _Where should the UI element be located?_ -> Slim progress banner at the top of the screen.
- _How should the banner behave on completion?_ -> Auto-hide after a short delay, turning green for success.
- _Which specific UI approach to use?_ -> Approach 2: Floating Sticky Header Banner.

## Open Questions

- None.
