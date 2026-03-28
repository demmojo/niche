## 1. MarketAnalysis Component Refactoring

- [x] 1.1 Introduce a state toggle for `activeTab` ('chat' | 'data').
- [x] 1.2 Refactor the existing chat interface into a conditionally rendered block.
- [x] 1.3 Add a new `useFirebaseSync` hook to `MarketAnalysis` for saving competitor edits and SWOT data.

## 2. Competitor Data Table Implementation

- [x] 2.1 Implement a sortable table rendering the `competitors` array within the 'data' tab.
- [x] 2.2 Add column toggling UI (checkboxes to show/hide columns like Name, Website, Score, Features).
- [x] 2.3 Implement inline editing for cells (e.g., changing a competitor's name or score triggers an update to the parent component or via `useFirebaseSync`).

## 3. Auto-SWOT Generation

- [x] 3.1 Add a "Generate Auto-SWOT" button within the 'data' tab.
- [x] 3.2 Implement a specific Gemini prompt that returns JSON structured SWOT data based on `competitors` and `rawData`.
- [x] 3.3 Render the resulting SWOT data in a 2x2 grid (Strengths, Weaknesses, Opportunities, Threats).
- [x] 3.4 Ensure the generated SWOT data is saved via `useFirebaseSync` and loaded on component mount.

## 4. Testing & Validation

- [x] 4.1 Update `MarketAnalysis.test.tsx` to un-skip and correctly implement the 5 skipped tests, mocking `useFirebaseSync` and asserting the new table, toggles, editing, and SWOT features.
