## 1. Documentation & Root Files (Foundation)

- [ ] 1.1 Create `CLAUDE.md` in the root directory and write the AI development instructions (project tracker, workflow, OpenSpec rules).
- [ ] 1.2 Update `README.md` and `docs/landing-page-master.md` to include comprehensive documentation for the "Next-Gen Analytics" and "Analytical Template System" features.

## 2. Accessible Tooltips (Standardization)

- [ ] 2.1 Audit the codebase using a global regex search for `group-hover:visible`, `group-hover:opacity-100`, and inline `title="..."` attributes. Replace every instance with the standardized `<Tooltip>` component.
- [ ] 2.2 Verify the `<Tooltip>` component properly utilizes `@radix-ui/react-tooltip` primitives for portaling and `aria-describedby` accessibility.
- [ ] 2.3 Refine the `<Tooltip>` logic to ensure hover-triggered tooltips are explicitly disabled or handled gracefully on mobile/touch devices (`< 768px`) to prevent sticky touch bugs.

## 3. Page Guides & Intent-Based Docs

- [ ] 3.1 Refactor `src/components/PageGuideModal.tsx` to support a new, rich configuration specifically for the `dlq` (Dead Letter Queue) tab.
- [ ] 3.2 Rewrite the existing guide content (`dashboard`, `matrix`, `settings`) to follow an "intent-based" structure (focusing on "Goal", "Why it matters", and "How to use it" workflows rather than just descriptive text).

## 4. Progressive Guided Tours (Beacons)

- [ ] 4.1 Create a new global state management store (e.g., `useOnboardingStore`) synchronized with `localStorage` to track `hasSeenDashboardTour`, `hasSeenLensTour`, etc., across user sessions.
- [ ] 4.2 Build a reusable, subtle pulsing `<TourBeacon>` component that acts as an opt-in launcher for guided tours.
- [ ] 4.3 Expand the `GuidedTour` functionality to the Dashboard and Lens Strategy Console, triggered by clicking the `<TourBeacon>`. Ensure the tour handles async data rendering correctly (waiting for DOM nodes like Lens charts to mount).

## 5. Verification & Testing

- [ ] 5.1 Click "Help" on the DLQ tab to verify the new intent-based documentation modal opens successfully.
- [ ] 5.2 Test tooltips across the application (especially inside `overflow-hidden` containers like modals or charts) to verify they render via Portals and do not clip.
- [ ] 5.3 Verify the Dashboard and Lens Strategy Console display the `<TourBeacon>` for first-time users, and that dismissing or completing the tour permanently hides the beacon on subsequent reloads.
