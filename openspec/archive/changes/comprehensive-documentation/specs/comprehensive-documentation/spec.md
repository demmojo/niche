# Comprehensive Documentation and Guides Update

The NicheAI platform is overhauling its documentation, in-app guides, and progressive disclosure patterns to align with modern 2026 UX/DX best practices. This implementation strictly follows YAGNI principles: relying on robust React-idiomatic registries, hoisted context providers, and declarative CSS, while rejecting fragile DOM polling, temporal states, and complex CSS spotlights.

## Features

### 1. Tooltip Standardization & Performance

- **Requirement:** Hoist the Radix `<TooltipProvider delayDuration={300} skipDelayDuration={150}>` to the root of the application (e.g., `App.tsx`) to prevent flashing and reduce context overhead.
- **Requirement:** Completely remove all raw inline Tailwind tooltip hacks (`group-hover:visible`, `group-hover:opacity-100`) across the entire codebase.
- **Requirement:** Mobile responsive behavior must be handled declaratively via CSS media queries (e.g., `hidden md:inline`). Do not use JavaScript window-size hooks. Complex tooltips must be promoted to interactive `Popover`s on mobile.

### 2. Progressive Guided Tours & Beacons

- **Requirement:** Create a localized `<TourBeacon>` component anchored robustly via Floating UI/Radix Popover, functioning as an opt-in launcher.
- **Requirement:** Implement global state tracking (`useOnboardingStore`) synchronized with `localStorage`. Ensure strict `partialize` configuration to only persist boolean completion flags.
- **Requirement:** Build a Tour Target Registry (`TourContext` and `useTourTarget` hook) to allow async components to register their `ref`s. Tours must deterministically attach to these registered refs, explicitly banning `MutationObserver` or `setTimeout` polling.

### 3. Intent-Based (JTBD) Page Guides

- **Requirement:** Refactor the content inside `PageGuideModal.tsx` to follow a Jobs-To-Be-Done (JTBD) taxonomy (e.g., using keys like `recover-failed-events` instead of `dlq`).
- **Requirement:** Embed "Time-to-Value" action buttons inside the guides (e.g., a button to instantly apply a default DLQ retry config) and use conditional disclosure (`<details>`) for advanced edge cases.
- **Requirement:** Add "Restart Tour" links inside the `PageGuideModal` to allow users to manually re-trigger dismissed beacon tours.

### 4. Root Repository Documentation (DX)

- **Requirement:** Create a centralized, XML-tagged `CLAUDE.md` in the repository root featuring "Just-In-Time" context routing and an explicit `<anti-patterns>` section.
- **Requirement:** Update `README.md` and `docs/landing-page-master.md` to prominently feature the recently added features.

## Scenarios

- **WHEN** a user rapidly moves their mouse across multiple items with tooltips,
- **THEN** the hoisted `<TooltipProvider>` uses `skipDelayDuration` to make subsequent tooltips appear instantly, creating a fluid, non-flashing experience.

- **WHEN** a developer views the application on a mobile device (`< 768px`),
- **THEN** standard hover tooltips are hidden via CSS, and complex interactions are handled by explicit `Popover`s.

- **WHEN** a target component finishes loading async data and mounts,
- **THEN** it calls the `useTourTarget` hook, which registers its DOM ref into the Tour Target Registry. The `GuidedTour` instantly and deterministically attaches its popover to the newly registered ref.

- **WHEN** a user navigates to the DLQ tab and clicks the generic "Help/Info" icon,
- **THEN** the `PageGuideModal` opens displaying JTBD documentation for `recover-failed-events`. The user can click a "Time-to-Value" action button to instantly apply a fix, or click a "Restart Tour" link if they want to replay the contextual guided tour.

- **WHEN** an AI assistant reads the repository context,
- **THEN** it parses the XML-tagged `CLAUDE.md`, reads the `<anti-patterns>` section, and avoids writing raw Tailwind `group-hover` tooltips or `MutationObserver` polling in future components.
