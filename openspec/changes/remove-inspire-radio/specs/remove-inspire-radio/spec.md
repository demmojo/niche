# Remove Inspire Radio

The Inspire Radio widget is being removed from the application's sidebar. This involves deleting the component, its tests, and cleaning up references in the main application file.

## Features

### 1. Component Deletion

- **Requirement:** `src/components/InspiringRadioWidget.tsx` and `src/__tests__/components/InspiringRadioWidget.test.tsx` must be deleted from the file system.

### 2. App.tsx Cleanup

- **Requirement:** The import `import { InspiringRadioWidget } from './components/InspiringRadioWidget';` must be removed from `src/App.tsx`.
- **Requirement:** The `<InspiringRadioWidget />` instantiation and its wrapping `<div className="mt-auto">...</div>` must be removed from the sidebar structure in `src/App.tsx`.
- **Requirement:** The `mt-auto` class must be added to the subsequent `<div className="p-4 border-t border-ink-dark/20 shrink-0 bg-paper-light">` element that contains the Insight Quest button to ensure it stays at the bottom of the sidebar.

## Scenarios

- **WHEN** a user views the main application sidebar
- **THEN** the Inspire Radio widget is no longer visible.
- **WHEN** the user resizes the window vertically
- **THEN** the Support/Settings and Insight Quest buttons remain anchored at the bottom of the sidebar.
