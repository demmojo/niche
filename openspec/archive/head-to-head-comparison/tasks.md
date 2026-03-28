## 1. App State & Table Updates

- [x] 1.1 Update `App.tsx` state to include `comparingCompetitorIds` (array of strings/IDs) and the handler functions.
- [x] 1.2 Update `DataPointsTable.tsx` to add multi-select checkboxes for competitors.
- [x] 1.3 Implement selection logic in `DataPointsTable.tsx` to restrict selection to a maximum of 2 competitors.
- [x] 1.4 Add a "Compare X Products" button to the header of `DataPointsTable.tsx` that triggers the comparison view.

## 2. Comparison Component

- [x] 2.1 Create new `HeadToHeadComparison.tsx` component in `src/components/`.
- [x] 2.2 Implement data normalization logic to unify `MyProductData` features (`ProductFeature`) and `Competitor` features (`coreFeatures` strings).
- [x] 2.3 Build the responsive UI layout (3-column for desktop, card-row for mobile) displaying features, integrations, target audience, and pricing.
- [x] 2.4 Integrate `HeadToHeadComparison.tsx` into `App.tsx` so it renders when `comparingCompetitorIds` has items.
- [x] 2.5 Add a "Back" or "Close" button in the comparison view to clear the selection and return to the main table.
