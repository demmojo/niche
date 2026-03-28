## 1. Documentation & Root Files (Foundation)

- [ ] 1.1 Create `CLAUDE.md` in the root directory. Ensure it uses an XML-tagged architecture, includes an explicit `<anti-patterns>` section, and acts as a "Just-In-Time" router to other docs.
- [ ] 1.2 Update `README.md` and `docs/landing-page-master.md` to include comprehensive documentation for the recent features.

## 2. Accessible & Performant Tooltips (Standardization)

- [ ] 2.1 Hoist `<TooltipProvider delayDuration={300} skipDelayDuration={150}>` to the root `App.tsx`.
- [ ] 2.2 Update `Tooltip.tsx` to rely on CSS media queries for mobile fallbacks, and restrict content to simple strings/nodes.
- [ ] 2.3 Audit the codebase using a global regex search for `group-hover:visible`, `group-hover:opacity-100`, and inline `title="..."` attributes. Replace every instance with the standardized `<Tooltip>`.

## 3. Page Guides & Intent-Based Docs (JTBD)

- [ ] 3.1 Refactor `src/components/PageGuideModal.tsx` keys to use a Jobs-To-Be-Done (JTBD) taxonomy (e.g., `recover-failed-events` instead of `dlq`, `analyze-competitors` instead of `matrix`).
- [ ] 3.2 Rewrite the existing guide content using conditional disclosure (`<details>`) for advanced info and embed actionable "Time-to-Value" buttons directly inside the guides.
- [ ] 3.3 Add "Restart Tour" links inside the `PageGuideModal` to allow manual re-triggering of tours.

## 4. Progressive Guided Tours & Beacons

- [ ] 4.1 Create a global `useOnboardingStore` (Zustand) synchronized with `localStorage`. Configure `persist` with strict `partialize` to only store boolean completion flags, avoiding ephemeral UI state serialization.
- [ ] 4.2 Build the `<TourBeacon>` component anchored robustly via Floating UI/Radix Popover, launching tours when clicked and dismissing permanently based on the Zustand store.
- [ ] 4.3 Build the Tour Target Registry (`TourContext` and `useTourTarget` hook) to allow async components to register their `ref` deterministically.
- [ ] 4.4 Update `GuidedTour.tsx` to consume the Tour Target Registry (replacing `setTimeout` or `MutationObserver` hacks) and ensure full keyboard accessibility (`Esc`, `Arrow` keys).
- [ ] 4.5 Expand the `GuidedTour` functionality to the Dashboard and Lens Strategy Console, triggered by clicking the `<TourBeacon>`.

## 5. Verification & Testing

- [ ] 5.1 Test tooltips across the application to ensure rapid hovering triggers the `skipDelayDuration` fluidly, and that mobile views correctly hide/promote tooltips using CSS.
- [ ] 5.2 Click "Help" on the DLQ tab to verify the new JTBD documentation modal opens successfully with functional "Time-to-Value" action buttons.
- [ ] 5.3 Verify the Dashboard and Lens Strategy Console display the `<TourBeacon>` for first-time users, and that completing the tour updates `localStorage` without writing ephemeral UI state.
