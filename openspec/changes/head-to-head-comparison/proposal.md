## Why

Users need the ability to compare their own product directly against competitors in a side-by-side view to easily spot differences in features, target audience, pricing, and integrations.

## What Changes

Introducing a Head-to-Head Comparison view.

- Updates to the Data Points Table to allow selecting up to 2 competitors.
- Updates to the main App state to handle the comparison mode.
- A new Head-To-Head Comparison component that normalizes and displays `MyProductData` against the selected `Competitor` objects.

## Capabilities

### New Capabilities

- `compare-competitors`: Allows users to select up to two competitors and view a side-by-side comparison of features, pricing, and integrations against their own product.

### Modified Capabilities

- `data-points-table`: Modified to support multi-select checkboxes and a new "Compare X Products" action button.
- `app-state-management`: Modified to track `comparingCompetitorIds`.

## Impact

- `src/components/DataPointsTable.tsx`
- `src/App.tsx`
- `src/components/HeadToHeadComparison.tsx` (New)
