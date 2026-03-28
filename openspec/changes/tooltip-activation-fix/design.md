## Context

Tooltips implemented via `group-hover:opacity-100` without the `invisible` utility class can still capture pointer events when `opacity` is 0. This is especially true if children within the tooltip have `pointer-events-auto`. Furthermore, if the wrapper element uses `flex` instead of `inline-flex`, it may take up the full width of its container, making the hover trigger area excessively large.

## Goals / Non-Goals

**Goals:**

- Fix the trigger area for the "Sync Now" button tooltip.
- Standardize the CSS classes for tooltip visibility using `invisible group-hover:visible`.
- Ensure tooltip wrapper elements use inline display properties (`inline-flex` or `inline-block`) so their hit area tightly bounds the trigger element.

**Non-Goals:**

- Redesign the visual appearance of tooltips.
- Switch to a third-party tooltip library.

## Decisions

**1. CSS Utility Standard for Group-Hover Tooltips**

- **Decision**: All pure CSS tooltips must use `opacity-0 invisible` by default, and `group-hover:opacity-100 group-hover:visible` on hover.
- **Rationale**: This guarantees that hidden tooltips are entirely removed from the hit-testing tree and cannot trigger unintended interactions or block elements beneath them.

**2. Tight Container Wrappers**

- **Decision**: Tooltip wrapper containers (like the one in `Tooltip.tsx` or inline ones) must use `inline-flex` or `inline-block`.
- **Rationale**: To prevent the container from expanding to fill available space, which inflates the hover area.

## Risks / Trade-offs

- **Risk: Breaking layout** -> Changing `flex` to `inline-flex` might slightly alter spacing in certain flexbox layouts.
- **Mitigation**: We will review the UI where these wrappers are used to ensure no unintended layout shifts occur.
