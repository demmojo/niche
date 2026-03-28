## Context

The Inspire Radio widget was an experimental feature added to the sidebar to play ambient audio and display fun facts. The user has decided to completely remove this feature from the application.

## Goals / Non-Goals

**Goals:**

- Completely remove all code related to the Inspire Radio feature.
- Ensure the UI layout remains intact (specifically the sidebar's bottom elements).
- Ensure no broken imports or tests remain.

**Non-Goals:**

- Removing any other features from the sidebar.

## Decisions

**1. Clean Deletion**

- **Decision**: We will delete the component file and its corresponding test file entirely, rather than just hiding it.
- **Rationale**: Keeps the codebase clean and reduces test suite execution time.

**2. Layout Preservation**

- **Decision**: We will transfer the `mt-auto` utility class to the next element in the sidebar (the "Insight Quest" button container) to maintain the visual layout.
- **Rationale**: The `InspiringRadioWidget` container previously acted as the flexbox spacer pushing everything below it to the bottom.

## Risks / Trade-offs

- **Risk: UI Regression** -> Removing the widget might cause the elements below it to float up.
- **Mitigation**: Carefully migrating the flexbox spacing classes (`mt-auto`) in `App.tsx` prevents this.
