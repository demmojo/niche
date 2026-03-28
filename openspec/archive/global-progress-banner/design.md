## Context
The application uses an array of objects (`activeTasks`) in `App.tsx` to track the sub-steps of a global sync or data pipeline. A new UI pattern was requested to make this state globally visible in a beautiful, unobtrusive way.

## Goals / Non-Goals

**Goals:**
- Provide a global, animated sticky banner for background tasks.
- Display the current active task name and overall percentage.
- Auto-hide the banner 3 seconds after all tasks reach 100%.

**Non-Goals:**
- Do not change how the `activeTasks` are processed or logged.
- Do not add "cancel sync" functionality to the banner (as syncs cannot be safely aborted mid-flight currently).

## Decisions

**1. Location & Animation**
- **Decision**: The banner will render absolutely positioned at the top of the viewport, sliding down using Framer Motion.
- **Rationale**: Keeps the user informed regardless of scroll position or active tab, without permanently taking up screen real estate.

**2. State Management**
- **Decision**: We will pass `isSyncing` and `activeTasks` as props to a new `GlobalProgressBanner` component directly from `App.tsx`.
- **Rationale**: Prevents having to rewrite the complex task-tracking logic into a separate Context provider just for this UI element.

## Risks / Trade-offs

- **Risk: Obscuring Navbar UI** -> The banner might cover important top-level navigation items.
- **Mitigation**: Ensure the banner sits *below* the main navbar if positioned relatively, or give it a high `z-index` but keep it slim enough that the user can still navigate if needed, or simply render it right below the header. We will render it immediately below the header.