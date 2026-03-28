# Comprehensive Documentation and Guides Update

The NicheAI platform is overhauling its documentation, in-app guides, and progressive disclosure patterns to align with modern 2026 UX best practices. This includes standardizing accessible tooltips, introducing beacon-initiated guided tours, and creating intent-based help content.

## Features

### 1. Tooltip Standardization

- **Requirement:** Completely remove all raw inline Tailwind tooltip hacks (`group-hover:visible`, `group-hover:opacity-100`) across the entire codebase.
- **Requirement:** Replace them with the robust `<Tooltip>` component wrapper (which utilizes `@radix-ui/react-tooltip` primitives) to ensure proper portaling (no z-index clipping) and ARIA accessibility.
- **Requirement:** Tooltips must handle mobile touch events gracefully without causing "sticky" hover states.

### 2. Progressive Guided Tours & Beacons

- **Requirement:** Create a subtle, pulsing `<TourBeacon>` component that acts as an opt-in launcher for guided tours.
- **Requirement:** Implement global state tracking (`useOnboardingStore`) synchronized with `localStorage` to persistently track `hasSeenDashboardTour`, `hasSeenLensTour`, etc., so users are not repeatedly nagged across sessions.
- **Requirement:** Expand the `GuidedTour` functionality to the Dashboard and Lens Strategy Console, launched only via the beacon.

### 3. Intent-Based Page Guides

- **Requirement:** Refactor the content inside `PageGuideModal.tsx` to follow an "intent-based" structure focusing on user goals, outcomes, and workflows rather than purely descriptive text.
- **Requirement:** Add a new, rich, intent-based configuration specifically for the Dead Letter Queue (`dlq`) tab.

### 4. Root Repository Documentation

- **Requirement:** Create a centralized `CLAUDE.md` in the repository root to guide AI-assisted development and standardize patterns.
- **Requirement:** Update `README.md` and `docs/landing-page-master.md` to prominently feature the recently added "Next-Gen Analytics" and "Analytical Template System."

## Scenarios

- **WHEN** a user hovers over an icon or truncated text inside an `overflow-hidden` container (like a modal or chart),
- **THEN** the `<Tooltip>` component renders the helpful text via a React Portal, appearing above all other UI elements without clipping, and announces the text to screen readers.

- **WHEN** a user visits the Dashboard or Lens Strategy Console for the first time,
- **THEN** a small, pulsing `<TourBeacon>` appears next to a key feature.

- **WHEN** the user clicks the `<TourBeacon>`,
- **THEN** the `GuidedTour` popover sequence initiates. Completing or dismissing the tour permanently hides the beacon.

- **WHEN** a user navigates to the DLQ tab and clicks the generic "Help/Info" icon,
- **THEN** the `PageGuideModal` opens and displays task-oriented, intent-based documentation specifically explaining how to resolve dead-letter messages.

- **WHEN** a developer clones the repository and starts an AI coding session,
- **THEN** the AI assistant reads `CLAUDE.md` to automatically follow the project's established conventions, OpenSpec workflow, and architectural decisions.
