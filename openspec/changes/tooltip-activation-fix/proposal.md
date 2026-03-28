## Why

The tooltip for the "Sync Now" button currently triggers too far from the button, leading to an unintuitive user experience. Additionally, tooltips across the codebase need a comprehensive review to ensure they are activated and hidden appropriately, specifically addressing issues like invisible elements incorrectly receiving hover events or container width causing overly large trigger areas.

## What Changes

- Update the wrapper for `SyncNowButton` to tightly fit the button.
- Ensure that the "Sync Now" tooltip correctly uses `invisible` and `group-hover:visible` classes to prevent unintended hover events on interactive children.
- Review and update tooltips across the application (e.g. `Tooltip.tsx` and inline `group-hover` tooltips) to use `inline-flex` or `inline-block` for wrappers, and `invisible` to disable pointer events appropriately.

## Capabilities

### Modified Capabilities

- `tooltip-behavior`: Tooltips will only trigger when the mouse is explicitly over the target element. Invisible tooltips will no longer block or respond to mouse events.

## Impact

The entire application UI where tooltips are used, primarily `src/App.tsx`, `src/components/Tooltip.tsx`, and other components using `group-hover` based tooltips.
