## 1. UI Infrastructure

- [x] 1.1 Create the generic `GuidedTour.tsx` component using `motion/react`.
- [x] 1.2 Implement the spotlight measurement and layout animation logic (box-shadow approach).
- [x] 1.3 Implement the popover positioning logic (top, bottom, left, right) ensuring it stays within viewport bounds.

## 2. Whiteboard Integration

- [x] 2.1 Add `data-tour` attributes to the corresponding elements in `VisualWhiteboard.tsx`, `CustomCardNode.tsx`, and `MindmapAIChat.tsx`.
- [x] 2.2 Define the tour steps array in `VisualWhiteboard.tsx`.
- [x] 2.3 Add `useEffect` to `VisualWhiteboard` to automatically start the tour on first visit (reading/writing to localStorage).
- [x] 2.4 Add a small "Help/Tour" button to the whiteboard UI to manually restart the tour.

## 3. Polish

- [x] 3.1 Ensure the spotlight transitions are smooth (e.g., using a spring animation).
- [x] 3.2 Ensure the popover looks modern and matches the application's aesthetic.
