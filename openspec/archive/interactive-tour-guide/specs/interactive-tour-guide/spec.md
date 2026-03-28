# Interactive Tour Guide

## 1. GuidedTour Component

- **Props**:
  - `steps`: Array of `{ target: string, title: string, content: string, placement?: 'top'|'bottom'|'left'|'right' }`
  - `isOpen`: boolean
  - `onComplete`: function
  - `onSkip`: function
- **Implementation Details**:
  - Maintain `currentStep` state.
  - On mount/step change, find the `target` element using `document.querySelector`.
  - Calculate its `getBoundingClientRect()`.
  - Render an animated spotlight (`motion.div` with a massive box-shadow and `border-radius: 8px`).
  - Render an animated Popover (`motion.div`) positioned adjacent to the spotlight based on the `placement` property, ensuring it stays within the viewport.
  - Render "Next", "Back", "Skip", and "Finish" buttons.

## 2. Whiteboard Tour Sequence

- **Step 1**: Target `[data-tour="whiteboard-list"]` (The left sidebar). Explain templates and multiple boards.
- **Step 2**: Target `[data-tour="canvas-area"]` (The React Flow canvas). Explain dragging cards and drawing visual links between nodes.
- **Step 3**: Target `[data-tour="card-tags"]` (The tags section on a CustomCardNode). Explain how to categorize and link notes conceptually.
- **Step 4**: Target `[data-tour="ai-chat-input"]` (The AI Chat textarea). Explain the `@mention` functionality to pull tagged cards into context.
- **Step 5**: Target `[data-tour="pin-to-board-btn"]` (A mocked or active "Pin to Board" button in the AI chat). Explain how insights can be converted to physical cards on the board.

## Scenarios

- **WHEN** a user visits the Mindmap tab for the very first time (localStorage `hasSeenWhiteboardTour` is false), **THEN** the tour automatically starts.
- **WHEN** the user clicks "Next", **THEN** the spotlight smoothly animates to the next target element.
- **WHEN** the user clicks "Skip" or "Finish", **THEN** the tour closes and sets the localStorage flag to true.
