# Global Progress Banner

A sticky, animated banner that provides global visibility for long-running background tasks.

## Features

### 1. Banner Display
- **Requirement:** REQ-BANNER-01: The system must display a global progress banner below the main navigation bar whenever `isSyncing` or `activeTasks.length > 0`.
- **Requirement:** REQ-BANNER-02: The banner must animate into view smoothly using Framer Motion (e.g., sliding down).

### 2. Task Progress Calculation
- **Requirement:** REQ-BANNER-03: The system must calculate the overall progress percentage by averaging the `progress` values of all items in the `activeTasks` array.
- **Requirement:** REQ-BANNER-04: The system must display the name of the currently active task (the first task where `progress < 100`).
- **Requirement:** REQ-BANNER-05: The system must display the step number of the active task relative to the total number of tasks (e.g., "Step 2 of 7").
- **Requirement:** REQ-BANNER-06: The banner must render a horizontal progress bar that fills according to the overall percentage.

### 3. Completion State
- **Requirement:** REQ-BANNER-07: When all tasks reach 100% (or `isSyncing` becomes false but `activeTasks` still exist at 100%), the banner must transition to a success state (e.g., green styling, "Sync Complete" message).
- **Requirement:** REQ-BANNER-08: The success state must persist for 3 seconds before the banner auto-hides and the `activeTasks` array is cleared visually from the banner.

## Scenarios
- **WHEN** the user triggers a "Sync Now" operation and `activeTasks` is populated.
- **THEN** the global progress banner animates into view below the navbar, displaying "Step 1 of X: [First Task Name]" and a 0% progress bar.

- **WHEN** the system completes the second task in a 5-task sequence.
- **THEN** the banner updates to "Step 3 of 5: [Third Task Name]" and the progress bar updates to reflect roughly 40% overall completion.

- **WHEN** the final task reaches 100% completion.
- **THEN** the banner text changes to "Sync Complete," the styling turns green, and 3 seconds later, the banner slides up and disappears.