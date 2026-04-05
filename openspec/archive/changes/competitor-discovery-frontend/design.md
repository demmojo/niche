# Design: Competitor Discovery Frontend Fix

## Context

The product fails to leverage an existing backend discovery feature when a user attempts deep validation without competitors, currently resulting in an unhelpful error. We need to implement the frontend wiring and UI to support automated discovery while maintaining user trust.

## Goals & Non-Goals

- **Goal**: Intercept the empty competitor state and trigger auto-discovery.
- **Goal**: Implement a HITL curation step to ensure users verify AI outputs.
- **Goal**: Use React 19 best practices for asynchronous state and fetches.
- **Non-Goal**: Modify the backend Exa/Gemini discovery algorithms.

## Architecture & Decisions

- **Explainable States**: Use specific loading text (e.g., 'Discovering competitors...') to keep the user informed of AI progress, avoiding generic spinners.
- **AbortController**: Ensure the fetch to `/api/campaign/discover-competitors` is wrapped in an `AbortController` to handle component unmounts gracefully and prevent race conditions.
- **HITL Principle**: Injecting a review step (the Curation UI) between discovery and the deep validation campaign prevents fully autonomous destructive/expensive actions.
- **State Management**: The discovered competitors will be temporarily held in component state during the review phase, and only committed to the global `competitors` state (and Firestore) upon user confirmation.

## Risks & Trade-offs

- **Risk**: The discovery API takes too long or fails.
  - **Mitigation**: Graceful degradation to manual entry ensures the user is never permanently blocked.
- **Trade-off**: Adding a review modal introduces an extra click, slightly increasing friction. However, this is heavily outweighed by the safety and trust gained through the HITL approach.

## Future Potential

- Implement streaming for competitor results to reduce perceived wait times.
- Support adding 'more like this' from the curation modal.
