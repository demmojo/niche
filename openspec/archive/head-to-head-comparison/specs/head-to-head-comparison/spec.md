# Head-to-Head Comparison

The Head-to-Head Comparison feature allows users to select up to two competitors from their data points table and compare them side-by-side with their own product.

## Features

### 1. Competitor Selection

- **Requirement:** `DataPointsTable.tsx` must render checkboxes for each competitor row. Users can select a maximum of 2 competitors.
- **Requirement:** A "Compare X Products" header button should appear when at least one competitor is selected.

### 2. Comparison View

- **Requirement:** `App.tsx` must maintain a `comparingCompetitorIds` state to toggle the comparison view.
- **Requirement:** `HeadToHeadComparison.tsx` must receive `MyProductData` and the selected `Competitor` arrays.
- **Requirement:** The component must normalize features (mapping `ProductFeature` objects and `coreFeatures` strings) into a unified list.
- **Requirement:** The component must display integrations, target audience, and pricing.
- **Requirement:** The layout must be 3-column on desktop and use a card-row layout on mobile.

## Scenarios

- **WHEN** the user selects a third competitor in the `DataPointsTable`
- **THEN** the selection is prevented or the oldest selection is replaced (max 2 enforced).

- **WHEN** the user clicks "Compare X Products"
- **THEN** the view switches to the Head-to-Head Comparison component.

- **WHEN** the user views the comparison on a mobile device
- **THEN** the layout shifts from a 3-column grid to a responsive card-row layout.
