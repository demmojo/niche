## 1. File Deletion

- [x] 1.1 Delete `src/components/InspiringRadioWidget.tsx`.
- [x] 1.2 Delete `src/__tests__/components/InspiringRadioWidget.test.tsx`.

## 2. App Refactoring

- [x] 2.1 Remove the `InspiringRadioWidget` import from `src/App.tsx`.
- [x] 2.2 Remove the `<InspiringRadioWidget />` component and its wrapping `div` from the sidebar in `src/App.tsx`.
- [x] 2.3 Add `mt-auto` to the subsequent `div` (`<div className="mt-auto p-4 border-t border-ink-dark/20 shrink-0 bg-paper-light">`) in `src/App.tsx` to maintain layout structure.

## 3. Verification

- [x] 3.1 Run tests (`npm test`) or vitest locally to ensure no broken references remain.
