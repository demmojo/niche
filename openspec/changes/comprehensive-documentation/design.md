## Context

The NicheAI platform has grown rapidly, leading to documentation fragmentation and UX debt. Tooltips are currently built using raw inline Tailwind CSS classes (`absolute opacity-0 invisible group-hover:visible group-hover:opacity-100`), which causes z-index clipping inside overflow-hidden containers, breaks screen-reader accessibility, and creates "sticky" hover bugs on mobile touch devices. The `PageGuideModal` provides module overviews but lacks a configuration for the new Dead Letter Queue (`dlq`) tab. The `GuidedTour` component is underutilized (only in `VisualWhiteboard`) and forces cognitive overload. Root repository documentation is outdated and lacks a central `CLAUDE.md`.

## Goals / Non-Goals

**Goals:**

- Standardize all tooltips across the app using the `Tooltip.tsx` wrapper (utilizing `@radix-ui/react-tooltip` primitives for portaling and ARIA compliance).
- Implement a progressive disclosure UX pattern: replace forced tours with non-intrusive "beacon" launchers that track completion state.
- Expand `GuidedTour` to the Dashboard and Lens Strategy Console.
- Refactor `PageGuideModal` content to be "intent-based" (Goal -> Why it matters -> How to use it) and add a configuration for the `dlq` tab.
- Update `README.md` and `docs/landing-page-master.md` with "Next-Gen Analytics".
- Create a comprehensive `CLAUDE.md` to guide AI-assisted development.

**Non-Goals:**

- Re-architecting the entire `GuidedTour` state machine from scratch (we will wrap the existing component in a beacon launcher and tracking logic).
- Adding complex backend user-preference tables (a robust `localStorage` sync is sufficient for the MVP onboarding tracker).

## Decisions

**1. Tooltip Standardization via Radix UI Portals**

- **Decision**: Eradicate all inline Tailwind tooltip hacks (`group-hover:visible`) and replace them strictly with the `<Tooltip>` component.
- **Rationale**: Inline Tailwind tooltips cannot escape `overflow: hidden` parent containers, leading to clipped content. They also lack `aria-describedby` linking for screen readers. The `Tooltip.tsx` component solves these issues natively through React portaling.
- **Alternatives Considered**:
  - _Native HTML `title` attributes_: Rejected. They are ugly, non-customizable, have hardcoded delays, and perform poorly on touch devices.

**2. Progressive Disclosure via Tour Beacons**

- **Decision**: Introduce a `<TourBeacon>` component (a small pulsing dot) that appears over new features for first-time users. Clicking the beacon launches the `GuidedTour`.
- **Rationale**: Forced multi-step modals are the #1 cause of onboarding friction and drop-off. Beacons allow users to opt-in to help when they are ready.
- **Alternatives Considered**:
  - _Auto-launching tours on page load_: Rejected. Disrupts user intent and causes annoyance if triggered repeatedly.

**3. Intent-Based Documentation Structure**

- **Decision**: Rewrite `PageGuideModal` content to follow an intent-based format, focusing on workflows and outcomes rather than just listing UI elements. Add a specific guide for the `dlq` tab.
- **Rationale**: Modern 2026 documentation standards emphasize task-oriented help (Diátaxis framework) to reduce time-to-value. Users reading the DLQ guide want to know "How do I fix this error?" not just "What is a dead letter queue?".

## Risks / Trade-offs

- **Risk: Breaking Touch Device Tooltips** -> Replacing all tooltips with a unified component might cause sticky hover states on mobile if touch events aren't handled correctly.
- **Mitigation**: The `Tooltip.tsx` component handles `onTouchStart` gracefully. We will explicitly disable hover-triggered tooltips on viewports `< 768px` to ensure a smooth mobile experience.
- **Risk: Asynchronous Data during Guided Tours** -> If a tour step targets an element that hasn't finished loading (e.g., a Lens chart), the tour might crash or point to empty space.
- **Mitigation**: Ensure the `GuidedTour` component logic waits for target DOM nodes to mount before displaying the popover.
