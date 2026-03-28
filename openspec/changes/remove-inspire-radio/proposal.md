## Why

The Inspire Radio feature, which plays generative ambient drone music and GTA 5 radio streams while showing fun facts, is being completely removed to streamline the UI and simplify the application's focus.

## What Changes

- Complete removal of the `<InspiringRadioWidget />` component and its associated tests.
- Removal of the widget's invocation from the main navigation sidebar in `App.tsx`.
- Adjusting CSS classes (like `mt-auto`) in `App.tsx` so the remaining bottom layout items are still correctly positioned at the bottom of the sidebar.

## Capabilities

### Modified Capabilities

- `main-sidebar-navigation`: Reduced complexity by removing the music/radio player widget.

## Impact

- `src/components/InspiringRadioWidget.tsx` (Deleted)
- `src/__tests__/components/InspiringRadioWidget.test.tsx` (Deleted)
- `src/App.tsx` (Modified)
