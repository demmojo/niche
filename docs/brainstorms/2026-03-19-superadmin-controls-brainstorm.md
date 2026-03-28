# Superadmin Controls Brainstorm

**Date:** 2026-03-19

## What We're Building

A robust way for Superadmins to impersonate regular users (viewing the app exactly as a non-superadmin would) and an interface to toggle the visibility of sidebar navigation items globally. These serve as emergency "kill switches" for features experiencing critical issues in production.

## Why This Approach

Based on industry best practices for React frontend administration:

1. **Dual Identity Tracking (Frontend only)**: Rather than dealing with complex token swapping (which NicheAI doesn't strictly need right now since most permissions are UI-driven), we track the real identity (`isSuperadmin`) and the effective identity (`effectiveIsSuperadmin`). A prominent sticky warning banner ensures the superadmin never forgets they are impersonating.
2. **Configuration-Driven Navigation**: By storing a `feature_flags` document in Firestore at a generic path (`system/feature_flags`), the React app can subscribe to updates in real time using `onSnapshot`. This allows superadmins to instantly remove problematic tabs from all clients without needing to deploy new code.

## Key Decisions

- **Data Model**: Store feature flags globally under `system/feature_flags`. Using a simple dictionary of boolean switches.
- **Routing Protection**: If a user manually types a URL or stays on a tab that a superadmin disables, the app should automatically revert their active tab to the `"dashboard"` to avoid broken UI states.
- **FOUC Handling**: Feature flags should default to "enabled" while loading to prevent a flash of unstyled content if the `system/feature_flags` document takes a moment to fetch.

## Open Questions

- _Should feature flags also block backend API routes?_ For now, we are strictly addressing the UI (sidebar and page rendering). If features contain sensitive actions, those API calls should theoretically check the flags as well. However, UI obfuscation handles 99% of user friction in a sudden outage.

## Next Steps

- Execute the tasks outlined in `openspec/changes/superadmin-feature-controls/tasks.md` using the `apply-openspec` workflow.
