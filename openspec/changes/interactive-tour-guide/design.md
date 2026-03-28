## Context

We need a step-by-step guided tour. React 19 currently has compatibility issues with older libraries like React Joyride, and adding bloated third-party libraries for a 5-step tour is inefficient. We will build a custom, elegant solution using our existing stack (Framer Motion + Tailwind CSS).

## Goals / Non-Goals

**Goals:**

- Build a generic `<GuidedTour>` component that accepts an array of steps.
- Provide smooth transitions (animated spotlight) between steps.
- Block interactions with the underlying page while the tour is active (or selectively allow clicks, but for simplicity, we'll block them).
- Highlight 5 specific features of the new Visual Whiteboard:
  1. Whiteboard List (Sidebar)
  2. Canvas Area
  3. Card Tags
  4. Contextual AI Chat
  5. Pin to Board

**Non-Goals:**

- A complex, multi-page tour system (this is strictly for single-page feature highlighting).
- Complex scroll-to-element logic (the whiteboard is mostly a fixed full-screen layout, so basic viewport positioning is sufficient).

## Decisions

**1. Custom Framer Motion Implementation**

- **Decision**: We will build the spotlight effect using an SVG overlay with a `<mask>` or a simple absolute `div` with a massive `box-shadow: 0 0 0 9999px rgba(0,0,0,0.6)` positioned over the target element's bounding rect.
- **Rationale**: The `box-shadow` approach combined with Framer Motion's `layout` animation provides a highly performant, GPU-accelerated transition between spotlighted elements without complex SVG math.

**2. Target Selection**

- **Decision**: We will add `data-tour="step-name"` attributes to the DOM elements we want to highlight, and query them via `document.querySelector('[data-tour="step-name"]')` when advancing steps.
- **Rationale**: CSS classes might change, but `data-tour` is explicitly meant for this and is resilient to refactoring.

## Risks / Trade-offs

- **Risk: DOM Elements not rendered in time.** -> React Flow nodes might render asynchronously.
- **Mitigation**: We will add a small `MutationObserver` or polling mechanism inside the Tour component to ensure the target element exists before attempting to measure and highlight it.
