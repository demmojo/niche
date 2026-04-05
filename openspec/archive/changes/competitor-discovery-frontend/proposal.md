# Proposal: Competitor Discovery Frontend Fix

## Why

Currently, when a user clicks 'Run Deep Validation Campaign' in `App.tsx` without having added any competitors, they receive a generic toast error: 'Please add at least 1 competitor first.' The backend endpoint `POST /api/campaign/discover-competitors` exists to solve this exact problem by discovering competitors automatically using Exa and Gemini, but the frontend was never wired up to call it. Instead of throwing an error and blocking the user, we should discover competitors using the endpoint and seamlessly integrate them into the flow.

## What Changes

- **Frontend (`src/App.tsx`)**: Update `handleGlobalSync` to intercept the empty `competitors` array condition. Show an explainable loading state and call the `POST /api/campaign/discover-competitors` endpoint.
- **Frontend Curation UI**: Introduce a `CompetitorDiscoveryModal` to adhere to the Human-in-the-Loop (HITL) product philosophy. Users must review, edit, or remove discovered competitors before proceeding.
- **Graceful Degradation**: Fallback to a user-friendly manual entry prompt if the endpoint fails or returns 0 results.

## Capabilities

- `automated-competitor-discovery`: Automatically fetch competitors if the user attempts to run a campaign without them.
- `hitl-competitor-curation`: Provide a Human-in-the-Loop interface for users to review AI-discovered competitors before deep validation.

## Impact

Eliminates a blocking user friction point, leverages existing backend AI capabilities, and builds trust by keeping the user in control of AI-generated inputs.
