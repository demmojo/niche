## Why

The current sidebar navigation items are not ordered in a way that reflects the typical user journey for a data/analytics product. This creates cognitive load and makes the product harder to navigate for new users who are looking for a logical progression from observing data to taking action.

## What Changes

The sidebar navigation items will be reordered and grouped logically to reflect a workflow-based navigation pattern: Observe -> Analyze -> Act -> Configure.

## Capabilities

### New Capabilities

- `grouped-navigation`: Navigation items are visually grouped by workflow stage.

### Modified Capabilities

- `sidebar-navigation`: Reordered and grouped items based on user journey stages.

## Impact

The primary layout component containing the sidebar navigation (likely `App.tsx` or a dedicated layout component) will be modified. User workflow will be more intuitive.
