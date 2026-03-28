## 1. Feature Flag Data Layer

- [ ] 1.1 Create or reuse a Firestore collection/document hook to subscribe to `system/feature_flags`.
- [ ] 1.2 Define default feature flags structure in `App.tsx` (e.g., `hideMindmap: false`, `hideMarketAnalysis: false`, etc.) so the app continues functioning if the document does not exist yet.

## 2. Superadmin Impersonation Toggle

- [ ] 2.1 Add `viewAsUser` state in `App.tsx` (or a Context).
- [ ] 2.2 Calculate `effectiveIsSuperadmin = isSuperadmin && !viewAsUser`. Pass `effectiveIsSuperadmin` instead of `isSuperadmin` to child components throughout `App.tsx`.
- [ ] 2.3 Create a persistent `ApprovalBanner`-style component (e.g., `<ImpersonationBanner />`) at the top of the app when `viewAsUser` is true to allow restoring superadmin privileges.

## 3. Superadmin Dashboard UI

- [ ] 3.1 Update `SuperadminDashboard.tsx` to include a "View as Regular User" button.
- [ ] 3.2 Update `SuperadminDashboard.tsx` to include a "Feature Flags" section with toggles for each major sidebar item. Include an `onToggle` handler that updates the `system/feature_flags` Firestore document.

## 4. Sidebar Navigation & Routing

> **CRITICAL DEPENDENCY**: The Sidebar Navigation tasks (Section 4) MUST be implemented AFTER the `navbar-logical-ordering` OpenSpec. The `navbar-logical-ordering` spec reorganizes the sidebar into a statically grouped array structure. This `superadmin-feature-controls` spec must wrap that newly grouped array with its feature-flag filtering logic. Do not attempt to conditionally render individual `<NavItem>` components before the grouping array is established.

- [ ] 4.1 Update the `nav` section in `App.tsx` (specifically the array structure introduced by `navbar-logical-ordering`) to conditionally render `NavItem`s based on the fetched feature flags state.
- [ ] 4.2 Add a `useEffect` to ensure if a user's `activeTab` becomes hidden by a feature flag, they are safely redirected to `"dashboard"`.
