## Why

Superadmins need the ability to verify the exact experience of regular users without logging into a separate test account. Currently, the `isSuperadmin` flag is hardcoded to specific emails, which permanently alters the UI.

Additionally, when a specific feature or page experiences critical issues in production, superadmins need a quick "kill switch" to hide that sidebar navigation item from all users globally until the issue is resolved.

## What Changes

1. **View-As Toggle (Impersonation)**: A toggle in the Superadmin Dashboard to drop superadmin privileges temporarily for the current session, allowing the superadmin to view the app as a regular user.
2. **Feature Flags / Nav Control**: A new interface in the Superadmin Dashboard to toggle the global visibility of specific sidebar navigation items (e.g., Market Analysis, Mindmap, Reports, Raw Data).

## Capabilities

### New Capabilities

- `superadmin-impersonation`: Allows superadmins to drop privileges temporarily via the UI.
- `global-feature-flags`: Allows superadmins to globally hide/show sidebar items using a centralized Firestore document.

### Modified Capabilities

- `sidebar-navigation`: Now respects global feature flags, hiding navigation items dynamically.
- `app-routing`: Protected routes for hidden features should prevent direct URL access.

## Impact

- **UI/Layout**: A persistent warning banner is shown when a superadmin is impersonating a regular user.
- **Data Model**: A new global `system/feature_flags` document in Firestore to store boolean flags for each sidebar item.
- **Routing/Navigation**: Sidebar items and main content rendering will be conditionally wrapped by feature flags and the effective superadmin status.
