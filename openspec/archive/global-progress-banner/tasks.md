## 1. Create Banner Component
- [x] 1.1 Scaffold a new `GlobalProgressBanner.tsx` component in `src/components/`.
- [x] 1.2 Add Framer Motion animations to handle mount/unmount and progress bar filling.
- [x] 1.3 Add logic to calculate active task, overall progress, and handle the 3-second success state timeout.

## 2. Integration with App.tsx
- [x] 2.1 Import and render `GlobalProgressBanner` in `App.tsx` directly below the main header.
- [x] 2.2 Pass `isSyncing` and `activeTasks` down to the component as props.