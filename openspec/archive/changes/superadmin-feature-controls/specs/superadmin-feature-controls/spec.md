# Superadmin Feature Controls

This spec details the implementation of a superadmin "view-as-user" toggle and global feature flags to control sidebar navigation.

## Features

### 1. View-As User Toggle (Impersonation)

- **Requirement:** A toggle switch in the Superadmin Dashboard that sets a `viewAsUser` state.
- **Requirement:** When `viewAsUser` is true, all `isSuperadmin` checks evaluate to `false` (i.e., `effectiveIsSuperadmin`).
- **Requirement:** A persistent banner must be displayed at the top of the screen stating "Viewing as Regular User" with a button to "Return to Superadmin". This button resets the `viewAsUser` state to false.
- **Requirement:** This toggle is only visible if the authenticated user's actual email is a superadmin email.

### 2. Feature Flags Dashboard

- **Requirement:** A new section in the Superadmin Dashboard to list all major sidebar items with toggle switches (e.g., "Market Analysis", "Mindmap", "Raw Data", "Reports", "Actions", "Task Inbox").
- **Requirement:** Toggling a switch updates a global Firestore document (e.g., `system/feature_flags`).
- **Requirement:** The UI should show real-time changes if another admin modifies the flags.

### 3. Sidebar Navigation Integration

- **Requirement:** The `App.tsx` sidebar navigation subscribes to the global `feature_flags` document.
- **Requirement:** If a feature flag is set to `false`, the corresponding `NavItem` is not rendered.
- **Requirement:** If a user is currently on a tab that becomes disabled, they should be redirected to a safe default tab (e.g., `"dashboard"`).

## Scenarios

- **WHEN** a superadmin clicks "View as Regular User" in the Superadmin Dashboard,
- **THEN** the Superadmin Dashboard and Superadmin Analytics tabs disappear, a persistent banner appears at the top, and the sidebar reflects exactly what a regular user sees.

- **WHEN** the superadmin clicks "Return to Superadmin" in the banner,
- **THEN** their superadmin privileges are restored and the banner disappears.

- **WHEN** a superadmin toggles "Market Analysis" off in the Feature Flags section,
- **THEN** the global Firestore document is updated, and the "Market Analysis" item instantly disappears from the sidebar for all active users. If a user was currently viewing Market Analysis, they are redirected to the Dashboard.
