# Feature Plan: Competitor Discovery Frontend Fix

## Why

Currently, when a user clicks "Run Deep Validation Campaign" in `App.tsx` without having added any competitors, they receive a generic toast error: "Please add at least 1 competitor first." The backend endpoint `POST /api/campaign/discover-competitors` exists to solve this exact problem by discovering competitors automatically using Exa and Gemini, but the frontend was never wired up to call it. Instead of throwing an error and blocking the user, we should discover competitors using the endpoint and seamlessly integrate them into the flow.

## What Changes

- **Frontend (`src/App.tsx`)**:
  - Update `handleGlobalSync` to intercept the empty `competitors` array condition.
  - Instead of returning an error toast, set an explainable loading state (e.g., "Discovering competitors...").
  - Call the `POST /api/campaign/discover-competitors` endpoint, passing the `baseIdea` (composed of `myProductData.name` and `myProductData.description`).
  - If competitors are successfully discovered, inject them into the global `competitors` state.
- **Frontend Curation UI (`src/components/CompetitorDiscoveryModal.tsx` or inline)**:
  - To adhere to the "Human-in-the-Loop (HITL)" product philosophy, we must not blindly proceed with AI-generated competitors without user review.
  - Implement a lightweight curation UI (e.g., a modal or a step in the wizard) to display the discovered competitors, allowing the user to review, edit, or remove them before confirming.
  - Once confirmed, the flow will automatically proceed to the `handleGlobalSync` deep validation campaign API call.
- **Graceful Degradation**:
  - If the `/discover-competitors` endpoint fails or returns 0 results, fallback to a user-friendly prompt asking them to manually enter at least one competitor URL to proceed.

## Capabilities

- `automated-competitor-discovery`: Automatically fetch competitors if the user attempts to run a campaign without them.
- `hitl-competitor-curation`: Provide a Human-in-the-Loop interface for users to review AI-discovered competitors before deep validation.

## Design/Architecture

- **Explainable States**: When calling the discovery endpoint, use clear, explainable loading states instead of generic spinners, keeping the user informed of the AI's progress.
- **React 19 Best Practices**: Ensure the fetch to `/api/campaign/discover-competitors` is wrapped in an `AbortController` to handle component unmounts gracefully and prevent race conditions.
- **HITL Principle**: By injecting a review step (the Curation UI) between discovery and the deep validation campaign, we prevent fully autonomous destructive/expensive actions and build user trust in the AI's outputs.
- **State Management**: The discovered competitors will be temporarily held in component state during the review phase, and only committed to the global `competitors` state (and subsequently Firestore) upon user confirmation.
