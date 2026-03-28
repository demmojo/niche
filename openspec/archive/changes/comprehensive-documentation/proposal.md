## Why

The NicheAI platform suffers from fragmented documentation, broken tooltip accessibility (raw Tailwind `group-hover` hacks causing clipping and mobile touch issues), and an unoptimized onboarding experience. Hardcoded multi-step tours force cognitive overload, while contextual help is either missing or overly descriptive. To align with modern 2026 UX/DX standards, we must standardize progressive disclosure, create robust intent-based (JTBD) documentation with actionable "Time-to-Value" buttons, optimize tooltip rendering performance, and bring technical and marketing docs up to date with XML-tagged structures.

## What Changes

A massive platform-wide overhaul of all documentation, user onboarding guides, and progressive disclosure patterns (tooltips). We are standardizing all tooltips using an accessible component with a hoisted provider. We are implementing localized, non-blocking beacons to launch tours, backed by a robust React-idiomatic Tour Target Registry (replacing fragile DOM polling). We are also implementing Jobs-To-Be-Done documentation structures and updating root repository files like `README.md`, `CLAUDE.md`, and `landing-page-master.md`.

## Capabilities

### New Capabilities

- `intent-based-guides`: Refactored `PageGuideModal` content focusing on Jobs-To-Be-Done (e.g., `recover-failed-events`), including conditional disclosure for advanced topics and "Time-to-Value" action buttons.
- `tour-beacons`: Progressive disclosure UI pattern (subtle pulsing indicators) that localized components can render to launch `GuidedTour`s.
- `tour-target-registry`: A React Context and `useTourTarget` hook that allows async DOM nodes to deterministically register themselves with the Tour Engine, eliminating `MutationObserver` and `setTimeout` hacks.
- `onboarding-state-tracking`: Global state management (`useOnboardingStore`) synchronized with storage using strict partialization to persistently track completed/dismissed tours without serializing ephemeral UI state.
- `global-developer-handbook`: Addition of a root `CLAUDE.md` featuring XML-tagged sections, "Just-In-Time" context routing, and explicit `<anti-patterns>` to guide AI-assisted development.

### Modified Capabilities

- `accessible-tooltips`: Complete removal of inline Tailwind tooltip hacks (`group-hover:visible`) across the codebase. Standardized to the `<Tooltip>` component with a globally hoisted `<TooltipProvider skipDelayDuration={150}>` to prevent flashing. Mobile touch handling is delegated to declarative CSS media queries.
- `marketing-documentation`: `README.md` and `landing-page-master.md` updated to prominently feature the recently added features.

## Impact

This impacts the entire frontend architecture and repository structure:

- **Root Files:** `README.md`, `CLAUDE.md`, `docs/landing-page-master.md`.
- **UI Components:** `Tooltip.tsx` (and its global provider in `App.tsx`), `GuidedTour.tsx`, `PageGuideModal.tsx`, and the new `<TourBeacon>` component.
- **Global Search & Replace:** Every instance of `group-hover:visible` across `App.tsx` and other modules will be refactored.
- **State Management:** Addition of a highly-optimized persistent onboarding tracker (Zustand/Storage) and a React Context for the Tour Target Registry.
