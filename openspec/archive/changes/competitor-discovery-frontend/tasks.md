# Tasks: Competitor Discovery Frontend

## Phase 1: Component & UI Development

- [ ] Create/update `CompetitorDiscoveryModal.tsx` in `src/components/`.
- [ ] Implement local component state to hold and edit discovered competitors.
- [ ] Build the UI for reviewing, deleting, and confirming the competitor list.
- [ ] Add an inline text input to the bottom of the list `[ + Add missing competitor URL ]` to allow users to manually append competitors the AI missed (additive curation, avoiding the subtractive-only trap).

## Phase 2: Two-Phase Fetch Strategy (Reverse Demo Hook)

- [ ] Implement Phase 1 Fetch: Hit the backend for raw Exa results (`name`, `domain`, `description`). This should return instantly (<2s).
- [ ] Render the raw competitor cards immediately to fulfill the promise. Display a per-card shimmer/explainable state where the LLM rationale goes (e.g., "AI analyzing market overlap...").
- [ ] Implement Phase 2 Fetch: Kick off standard background Promises to the LLM (either per-card or batched) to calculate the `matchTier` and `matchRationale`.
- [ ] As Phase 2 Promises resolve, replace the shimmer states on the cards with the final LLM analysis.

## Phase 3: Core Logic Integration & Fallback Handling

- [ ] Integrate `CompetitorDiscoveryModal` into the `App.tsx` render tree and validation flow.
- [ ] Wrap all API calls with a React 19 `AbortController` for safe cleanup.
- [ ] Wire the modal's 'Confirm' callback to update the global `competitors` state and resume the original validation flow.
- [ ] Ensure empty results or Exa failures trigger the manual entry fallback gracefully.
- [ ] Test the E2E flow to ensure seamless transition from empty state to deep validation without 15-second blocking drop-offs.
