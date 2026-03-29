## Context

The application checks `isSuperadmin` explicitly via email (`mo.hassaniv@gmail.com`). We need a way to override this state for the frontend. For feature flags, we need a globally synced state that the app listens to.

## Goals / Non-Goals

**Goals:**

- Superadmins can toggle their view to mimic a normal user.
- Superadmins can easily restore their superadmin view.
- Superadmins can hide/show specific sidebar nav items globally in real-time.

**Non-Goals:**

- Per-user feature flags (this implementation is global only for now).
- Complex backend impersonation tokens (since the current implementation is mostly frontend-driven UI overrides, we'll keep it simple: `effectiveIsSuperadmin`).
- Database-level read/write rules based on impersonation. The goal is to verify the UI experience and hide features globally.

## Decisions

**1. Impersonation Implementation**

- **Decision**: Introduce a `viewAsUser` local state/context that overrides the `isSuperadmin` boolean.
- **Rationale**: Simple, doesn't require backend changes. The UI will calculate `effectiveIsSuperadmin = isSuperadmin && !viewAsUser`. A persistent banner will allow restoring the superadmin view.
- **Alternatives Considered**:
  - _Issuing new tokens_: Unnecessary overhead since the primary goal is UI verification and the app doesn't currently use strict backend impersonation tokens for specific users.

**2. Feature Flag Storage**

- **Decision**: Store a single document in Firestore at a generic `system/feature_flags` path.
- **Rationale**: Easy to listen to via `onSnapshot` so all connected clients update their sidebar instantly when a superadmin flips a switch. Using a generic path allows us to manage global settings without attaching to a specific user.
- **Alternatives Considered**:
  - _Using an external service like LaunchDarkly_: Overkill for a simple global kill switch that can easily be handled natively in Firebase.

## Risks / Trade-offs

- **Risk: Layout Shifts (FOUC)** -> Fetching feature flags asynchronously might cause the sidebar to pop in.
- **Mitigation**: Handle loading states gracefully or use sensible defaults (e.g., all features enabled until the document loads).
- **Risk: Direct Navigation Bypass** -> Hiding a sidebar item does not prevent a user from typing the URL directly if they know it.
- **Mitigation**: Apply a feature flag check on the rendered content (the active tab router) to show an empty or "Feature disabled" state instead of the actual content.
