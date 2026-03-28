## Why

The NicheAI platform suffers from fragmented and outdated documentation, broken accessibility patterns for tooltips (raw Tailwind `group-hover` hacks causing clipping), and an unoptimized onboarding experience. Hardcoded multi-step tours force cognitive overload, while contextual help (like the DLQ page guide) is entirely missing. To align with modern 2026 UX standards, we must standardize progressive disclosure, create robust intent-based documentation, and bring technical and marketing docs up to date.

## What Changes

A massive platform-wide overhaul of all documentation, user onboarding guides, and progressive disclosure patterns (tooltips). We are standardizing all tooltips using a robust, accessible component, replacing forced tours with beacon-initiated guides, implementing intent-based documentation structures, and updating root repository files like `README.md`, `CLAUDE.md`, and `landing-page-master.md`.

## Capabilities

### New Capabilities

- `intent-based-guides`: Refactored in-app `PageGuideModal` content focusing on user goals rather than purely descriptive text, including a new guide for the Dead Letter Queue (`dlq`) tab.
- `tour-beacons`: Progressive disclosure UI pattern (subtle pulsing indicators) that launch the `GuidedTour` only when users opt-in.
- `onboarding-state-tracking`: Global state management (`useOnboardingStore`) synchronized with storage to persistently track which tours a user has completed or dismissed.
- `global-developer-handbook`: Addition of a root `CLAUDE.md` to guide AI-assisted development and standardize repository patterns.

### Modified Capabilities

- `accessible-tooltips`: Complete removal of raw, inline Tailwind tooltip hacks (`group-hover:visible group-hover:opacity-100`) across the codebase, standardized strictly to the `<Tooltip>` component to fix z-index clipping and ensure ARIA compliance.
- `marketing-documentation`: `README.md` and `landing-page-master.md` updated to prominently feature the recently added "Next-Gen Analytics" and "Analytical Template System."

## Impact

This impacts the entire frontend architecture and repository structure:

- **Root Files:** `README.md`, `CLAUDE.md`, `docs/landing-page-master.md`.
- **UI Components:** `Tooltip.tsx`, `GuidedTour.tsx`, `PageGuideModal.tsx`, and the introduction of a new `<TourBeacon>` component.
- **Global Search & Replace:** Every instance of `group-hover:visible` across `App.tsx`, `VisualSyncModal.tsx`, `InsightEngineChat.tsx`, and other modules will be refactored.
- **State Management:** Addition of a persistent onboarding tracker (Zustand/Storage).
