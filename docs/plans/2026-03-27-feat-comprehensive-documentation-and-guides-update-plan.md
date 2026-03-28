---
title: feat: Comprehensive Documentation and Guides Update
type: feat
status: active
date: 2026-03-27
---

# Comprehensive Documentation and Guides Update

## Overview

A platform-wide overhaul of all documentation, user onboarding guides, and progressive disclosure patterns (tooltips). This initiative aligns the NicheAI platform with modern 2026 UX/DX best practices—establishing an "intent-based" (Jobs-To-Be-Done) documentation hierarchy, standardizing accessible & performant tooltips, and bringing the repository's core marketing and technical documentation up to date.

Following a rigorous technical review, the implementation strictly adheres to YAGNI principles and robust React patterns: eliminating fragile DOM observers in favor of a React Target Registry, dropping unnecessary temporal state (like "Snooze" or global "Beacon Queues"), and relying on declarative CSS for mobile responsiveness.

## Problem Statement

The NicheAI platform suffers from fragmented and outdated documentation at both the codebase and user-interface levels:

- **Root Documentation:** The `README.md` and `docs/landing-page-master.md` are missing the recently added features. There is no central `CLAUDE.md` to guide AI-assisted development.
- **In-App Guides:** The `PageGuideModal` is hardcoded to specific tabs and lacks documentation for the Dead Letter Queue (`dlq`). Content is descriptive rather than intent-based. The `GuidedTour` component is underutilized.
- **Tooltips:** The codebase is littered with raw inline Tailwind classes (`group-hover:visible`), causing z-index clipping, ruining accessibility (missing ARIA portaling), and providing a broken experience on touch devices. At scale, individual tooltip providers also cause performance degradation.
- **UX Debt:** Onboarding is ad-hoc. We lack a robust progressive disclosure mechanism (like subtle "beacons") to introduce complex features without forcing blocking multi-step modals.

## Proposed Solution

1. **Repository & Marketing Docs:** Create a comprehensive, XML-tagged `CLAUDE.md` with explicit anti-patterns. Update `README.md` and `docs/landing-page-master.md`.
2. **Accessible & Performant Tooltips:** Standardize all tooltips to use a refined `<Tooltip>` component. Hoist the `<TooltipProvider>` to the app root with `skipDelayDuration` for fluid UX. Restrict tooltips to simple strings, and use CSS media queries to handle mobile tap-to-open fallbacks (promoting complex tooltips to `Popover`s).
3. **Intent-Based (JTBD) Guides:** Refactor `PageGuideModal` content to a Jobs-To-Be-Done taxonomy (e.g., `recover-failed-events`). Add "Time-to-Value" action buttons and conditional disclosure inside the guides. Add a "Restart Tour" capability.
4. **Progressive Disclosure Tours:** Implement localized `<TourBeacon>` components. Track tour completion state persistently via Zustand with strict partialization (only persisting boolean flags). Use a robust React-idiomatic **Tour Target Registry** instead of fragile DOM polling to attach tours to async elements.

## Technical Approach

### Architecture

- **Tooltips:** Hoist `<TooltipProvider delayDuration={300} skipDelayDuration={150}>` to `App.tsx`. The `<Tooltip>` component uses Radix UI for portaling (`sideOffset={4}`, `collisionPadding={8}`). Mobile responsive behavior is handled declaratively via CSS (`hidden md:inline`), not JS window sizing.
- **Tour State:** Implement a global Zustand store (`useOnboardingStore`) synchronized with `localStorage`. Use `partialize` to strictly whitelist completion flags (`hasSeenDashboardTour`, etc.).
- **Beacons & Tours:** Build a reusable `<TourBeacon>` anchored robustly via Radix Popover/Floating UI. Tours must have a progress indicator, an always-visible Dismiss button, and full keyboard accessibility (`Esc`, `Arrow` keys).
- **Tour Target Registry:** Eliminate `setTimeout` and `MutationObserver` hacks. Target components will use a `useTourTarget('target-id')` hook to register their `ref` in a lightweight context, allowing the Tour Engine to deterministically attach popovers when async data finishes loading.

### Implementation Phases

#### Phase 1: Foundation (Docs & Tooltips)

- Create XML-tagged `CLAUDE.md` with `<anti-patterns>` section.
- Update `README.md` and `landing-page-master.md`.
- Hoist `<TooltipProvider>` to root. Audit and replace all inline `group-hover:visible` hacks with the optimized `<Tooltip>` component.
- **Success Criteria:** Zero raw Tailwind tooltips remain; codebase docs are up-to-date; no tooltip flashing occurs when moving mouse rapidly across items.

#### Phase 2: Page Guides & Intent Refactoring

- Rename guide keys to JTBD taxonomy (e.g., `recover-failed-events`).
- Rewrite guide content using conditional disclosure (`<details>`) and add "Time-to-Value" action buttons (e.g., "Apply default retry config").
- Add "Restart Tour" buttons to the `PageGuideModal`.
- **Success Criteria:** Clicking "Help" opens task-oriented, actionable documentation.

#### Phase 3: Progressive Guided Tours & Beacons

- Build the `useOnboardingStore` with strict partialization.
- Create the `<TourBeacon>` component.
- Implement the Tour Target Registry (`TourContext` and `useTourTarget` hook).
- Implement the `GuidedTour` for the Dashboard and Lens Strategy Console, triggered by beacons.
- **Success Criteria:** Users see beacons that reliably attach to async DOM nodes without polling, can navigate via keyboard, and state is safely persisted without I/O thrashing.

## Acceptance Criteria

### Functional Requirements

- [ ] `CLAUDE.md` exists with XML tags and explicit anti-patterns.
- [ ] Tooltips render via Portals and use CSS to handle mobile fallbacks (complex content promoted to Popover).
- [ ] Global `TooltipProvider` handles `skipDelayDuration` for fluid rapid hovering.
- [ ] Guide content uses JTBD naming and contains actionable "Time-to-Value" buttons.
- [ ] Beacons appear locally (no global queue) and permanently dismiss on click.
- [ ] Guided tours use the Tour Target Registry, support keyboard navigation, and wait for async DOM nodes robustly (no `MutationObserver` or `setTimeout`).
- [ ] Zustand onboarding store only persists boolean completion flags to `localStorage`.

### Non-Functional Requirements

- [ ] **Accessibility:** All tooltips must use `aria-describedby`. Tours must be keyboard-navigable.
- [ ] **Simplicity (YAGNI):** No complex temporal state (snooze), no global beacon queues, and no fragile "spotlight" CSS background dimming.

## References & Research

- Best Practices Research: Diátaxis framework, Jobs-To-Be-Done (JTBD), Progressive Disclosure UX (beacons), Radix UI performance & accessibility standards.
