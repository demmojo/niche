---
title: feat: Comprehensive Documentation and Guides Update
type: feat
status: active
date: 2026-03-27
---

# Comprehensive Documentation and Guides Update

## User Value Proposition

**Empower users to master complex features without reading a manual.**

NicheAI has incredibly powerful tools (like the Strategy Toolbox, Lens Strategy Console, and Next-Gen Analytics), but if users don't know how to use them, that power is useless. Traditional, forced multi-step product tours annoy users, and hidden features never get discovered.

**Why use this tool?**
This initiative transforms the platform from a "complex tool you have to learn" into an "intuitive assistant that guides you."

**What is the expectation of the result?**

- **Discoverability:** Users effortlessly discover advanced features at exactly the moment they need them, through subtle, contextual "beacons."
- **Clarity:** Tooltips and guides don't just explain _what_ a button does; they explain _why_ the user should care (intent-based documentation).
- **Frictionless Experience:** No more annoying popups on mobile, no more clipped text, and no more forced tours that interrupt the user's flow.

**The Best Case Scenario:**
A new founder logs into NicheAI. Instead of being bombarded by a 10-step unskippable tour, they are left to explore. When they hover over the "Algorithmic Blue Ocean Value Curve," a beautifully formatted tooltip explains how it helps them beat competitors. A subtle, pulsing beacon guides them to connect their first data source. They feel completely supported, never overwhelmed, and immediately understand the value of the platform.

## Overview

A massive platform-wide overhaul of all documentation, user onboarding guides, and progressive disclosure patterns (tooltips). This initiative aligns the NicheAI platform with modern 2026 UX best practices—moving away from forced tours to beacon-initiated guides, establishing an "intent-based" documentation hierarchy, standardizing broken accessibility patterns in tooltips, and bringing the repository's core marketing and technical documentation up to date.

## Problem Statement

The NicheAI platform suffers from fragmented and outdated documentation at both the codebase and user-interface levels:

- **Root Documentation:** The `README.md` and `docs/landing-page-master.md` are missing the recently added "Next-Gen Analytics" features. There is no central `CLAUDE.md` to guide AI-assisted development.
- **In-App Guides:** The `PageGuideModal` is hardcoded to specific tabs and completely lacks documentation for the Dead Letter Queue (`dlq`) tab. Content is descriptive rather than intent-based. The `GuidedTour` component is only implemented in `VisualWhiteboard` and uses an inconsistent naming convention (`mindmap`).
- **Tooltips:** Despite having a custom `Tooltip.tsx` component, the codebase is littered with raw inline Tailwind classes (`group-hover:visible group-hover:opacity-100`), which causes z-index clipping, ruins accessibility (missing ARIA portaling), and provides a broken experience on touch devices.
- **UX Debt:** Onboarding is currently ad-hoc. We lack a robust progressive disclosure mechanism (like subtle "beacons") to introduce complex features (Dashboard, Lens Strategy Console) to users without forcing blocking multi-step modals.

## Proposed Solution

1. **Repository & Marketing Docs:** Create a comprehensive `CLAUDE.md`. Update `README.md` and `docs/landing-page-master.md` to feature the "Next-Gen Analytics" and "Analytical Template System."
2. **Accessible Tooltips:** Standardize all tooltips across the app to use the `<Tooltip>` component. Remove all inline `group-hover` tooltip hacks. Ensure the component handles mobile touch events gracefully.
3. **Intent-Based Guides:** Refactor `PageGuideModal` to support the `dlq` route. Rewrite existing guides to be "intent-based" (focusing on user goals and workflows rather than technical descriptions).
4. **Progressive Disclosure Tours:** Implement a beacon-style launcher system for `GuidedTour`. Expand tours to the Dashboard and Lens Strategy Console. Track tour completion state persistently so users aren't nagged across sessions.

## Technical Approach

### Architecture

- **Tooltips:** Rely strictly on the `Tooltip.tsx` wrapper (which utilizes `framer-motion` and `@radix-ui/react-tooltip` primitives for portaling and ARIA compliance). Disable hover-triggered tooltips on viewports `< 768px` to prevent sticky touch bugs.
- **Tour State:** Implement a global Zustand store (e.g., `useOnboardingStore`) synchronized with `localStorage` (or backend user preferences) to track `hasSeenDashboardTour`, `hasSeenLensTour`, etc.
- **Beacons:** Build a reusable `<TourBeacon>` component that renders a subtle pulsing indicator over a target element if the tour hasn't been completed.

### Implementation Phases

#### Phase 1: Foundation (Docs & Tooltips)

- Create `CLAUDE.md` with repository conventions.
- Update `README.md` and `landing-page-master.md`.
- Audit the codebase via regex for `group-hover:visible` and inline `title="..."` attributes. Replace them all with the standard `<Tooltip>` component.
- **Success Criteria:** Zero raw Tailwind tooltips remain; codebase docs are up to date.

#### Phase 2: Page Guides & Intent Refactoring

- Update `PageGuideModal.tsx` to include a rich, intent-based configuration for the `dlq` tab.
- Rewrite the `dashboard`, `matrix`, and `settings` guides to use an intent-based structure (Goal -> Why it matters -> How to use it).
- **Success Criteria:** Clicking "Help" on the DLQ tab opens the correct documentation modal.

#### Phase 3: Progressive Guided Tours

- Build the `useOnboardingStore` to track tour completion state.
- Create the `<TourBeacon>` component.
- Implement the `GuidedTour` for the Dashboard and Lens Strategy Console, triggered by clicking the beacon.
- **Success Criteria:** Users see a pulsing beacon on new features. Clicking it starts the tour. Completing or dismissing it hides the beacon permanently.

## Acceptance Criteria

### Functional Requirements

- [ ] `README.md` and `docs/landing-page-master.md` contain documentation for "Next-Gen Analytics".
- [ ] `CLAUDE.md` exists in the root directory and contains AI development instructions.
- [ ] Navigating to the `dlq` tab and opening the help guide displays DLQ-specific documentation.
- [ ] Tooltips across the application render above all other UI elements (via Portals) and are accessible to screen readers.
- [ ] No tooltips trigger "sticky" hover states on mobile touch devices.
- [ ] The Dashboard and Lens Strategy Console display a "beacon" for first-time users that launches a `GuidedTour`.
- [ ] Dismissing or completing a tour prevents the beacon from appearing on subsequent page loads.

### Non-Functional Requirements

- [ ] **Accessibility:** All tooltips must use `aria-describedby` or equivalent Radix primitives.
- [ ] **Consistency:** All documentation copy must follow the intent-based structure.

## Dependencies & Prerequisites

- The `Tooltip.tsx` component must be fully robust and support Radix UI portaling to avoid clipping inside `overflow-hidden` containers (like modals or charts).
- The `GuidedTour` component must be able to wait for async data to load before attaching to DOM nodes (e.g., waiting for Lens charts to render).

## Documentation Plan

- This entire feature is a documentation update. It will self-document via `CLAUDE.md` and the in-app guides.

## References & Research

- Best Practices Research: Diátaxis framework, Progressive Disclosure UX (beacons), Radix UI accessibility standards.
- Current Gaps: Missing DLQ guide, underutilized GuidedTour, fragmented Tailwind tooltips.
