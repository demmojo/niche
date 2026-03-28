## Why
Users currently trigger long-running background tasks like "Global Sync" (taking 20-45 seconds) and may navigate away from the Background Tasks tab. Without global progress visibility, they don't know the current state of the application.

## What Changes
Introduces a `GlobalProgressBanner` component at the top of the application layout that listens to the global `activeTasks` array, displaying the active step and overall progress bar, and elegantly auto-hides upon completion.

## Capabilities
### New Capabilities
- `global-progress-visibility`: A sticky banner that is visible on any tab during long-running tasks.
- `step-by-step-feedback`: Explicitly lists the current task being executed (e.g., "Step 2 of 7: Analyzing market trends").

## Impact
Affects the main `App.tsx` layout and integrates with the existing `activeTasks` state. No backend changes required.