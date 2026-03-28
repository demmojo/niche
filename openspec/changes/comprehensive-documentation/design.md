## Context

The NicheAI platform has grown rapidly, leading to documentation fragmentation and UX/DX debt. Tooltips are currently built using raw inline Tailwind CSS classes (`group-hover:visible group-hover:opacity-100`), which causes z-index clipping, breaks screen-reader accessibility, and creates "sticky" hover bugs on mobile touch devices. Furthermore, rendering individual Providers for every tooltip degrades performance. The `PageGuideModal` provides module overviews but is descriptive rather than actionable. Root repository documentation is outdated and lacks a central, machine-optimized `CLAUDE.md`.

## Goals / Non-Goals

**Goals:**

- Standardize all tooltips using the `Tooltip.tsx` wrapper with a hoisted `<TooltipProvider>` to optimize performance and enable `skipDelayDuration` fluid hovering. Use CSS media queries for mobile handling.
- Implement progressive disclosure: use localized `<TourBeacon>` launchers.
- Implement a React-idiomatic Tour Target Registry (`useTourTarget`) for `GuidedTour` to robustly handle async DOM node attachment.
- Refactor `PageGuideModal` content to a Jobs-To-Be-Done (JTBD) taxonomy, adding conditional disclosure (`<details>`), "Time-to-Value" action buttons, and a "Restart Tour" capability.
- Update `README.md` and `docs/landing-page-master.md`.
- Create a comprehensive, XML-tagged `CLAUDE.md` with explicit `<anti-patterns>` to guide AI-assisted development.

**Non-Goals:**

- Adding complex temporal state (e.g., "Snooze" functionality for beacons) or global beacon queues. These violate YAGNI and introduce unnecessary complexity.
- Re-architecting the entire `GuidedTour` state machine from scratch (we will wrap the existing component in the registry and tracking logic).
- Implementing complex CSS "Spotlight" effects (dimming the background) which are fragile on responsive layouts. Radix Popovers are sufficient.

## Decisions

**1. Tooltip Standardization & Performance Hoisting**

- **Decision**: Hoist `<TooltipProvider>` to the app root. Eradicate all inline Tailwind tooltip hacks and replace them strictly with the `<Tooltip>` component. Use declarative CSS (`hidden md:inline`) for mobile toggling.
- **Rationale**: Inline Tailwind tooltips clip inside `overflow-hidden` containers. Wrapping every individual tooltip in its own Radix Provider causes exponential memory growth. JS window resizing for mobile is a React anti-pattern; CSS is deterministic.

**2. Localized Beacons (YAGNI applied)**

- **Decision**: Introduce a localized `<TourBeacon>` component that simply reads a boolean from the Zustand store.
- **Rationale**: A global "Beacon Queue" or "Snooze" system introduces massive state complexity. Beacons are non-blocking by design, so simple localization is sufficient.

**3. Tour Target Registry**

- **Decision**: Eliminate `MutationObserver` and `setTimeout` polling for async DOM nodes in tours. Create a React Context where target components use a `useTourTarget('target-id')` hook to register their `ref`.
- **Rationale**: DOM polling in React is a severe performance leak and breaks encapsulation. A registry allows async components to deterministically notify the tour engine the exact millisecond they mount.

**4. Strict State Partialization for Tours**

- **Decision**: Use Zustand's `persist` middleware with strict `partialize` to only store boolean completion flags (`hasSeenLensTour: true`) in `localStorage`.
- **Rationale**: Persisting ephemeral UI state (`currentStep`, `isTourActive`) causes constant synchronous I/O thrashing and can restore invalid states across sessions.

## Risks / Trade-offs

- **Risk: Breaking Touch Device Tooltips** -> Replacing all tooltips might cause sticky hover states on mobile.
- **Mitigation**: Force complex tooltips into `Popover` components for mobile, and use strictly CSS-driven visibility classes to handle responsive design without JS listeners.
