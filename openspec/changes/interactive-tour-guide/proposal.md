## Why

The Visual Knowledge Whiteboard introduces several complex, interconnected concepts (infinite canvas, decoupled cards, bi-directional links, tags, and contextual AI chat). To reduce the learning curve, users need a beautiful, step-by-step interactive guide that highlights these features one by one in the UI.

## What Changes

1. **Interactive Tour Engine**: A custom, lightweight, React 19-compatible guided tour component powered by Framer Motion.
2. **Whiteboard Onboarding Sequence**: A 5-step tour that auto-starts the first time a user visits the Mindmap tab.
3. **State Persistence**: Store the `hasSeenWhiteboardTour` boolean in `localStorage` so the tour doesn't constantly replay.
4. **Restart Tour Button**: Add a small help icon to manually trigger the tour again.

## Capabilities

### New Capabilities

- `interactive-tour`: Can target any DOM element by CSS selector, draw a spotlight/cutout, and present a floating popover with "Next", "Back", and "Skip" buttons.
- `whiteboard-onboarding`: Specifically guides users through the whiteboard sidebar, canvas, tags, AI chat, and pinning.

## Impact

- **UI Architecture**: Adds a high z-index overlay and popover system.
- **Dependencies**: No new external dependencies required (uses existing `motion/react`, `lucide-react`, and Tailwind).
