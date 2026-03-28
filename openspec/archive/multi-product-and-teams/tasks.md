## 1. Backend / Data Model Preparations

- [x] 1.1 Update `firestore.rules` to secure workspaces using a `members` ACL array and restrict product creation to superadmins.
- [x] 1.2 Refactor data access: Deprecate `useLocalStorage` for shared collaborative entities in favor of Firestore `onSnapshot` with native offline persistence (to prevent split-brain issues).
- [x] 1.3 Implement a legacy data migration utility to move `user.uid`-keyed local storage to the new shared workspace format.
- [x] 1.4 Create a Callable Cloud Function (`redeemInvite`) for secure, atomic invite redemption.

## 2. UI Components & Modals

- [x] 2.1 Create the generic `RequestAccessModal` component for upsell flows that writes to the `alpha_feedback` collection.
- [x] 2.2 Refactor the product dropdown to use Radix UI `DropdownMenu` for better accessibility.
- [x] 2.3 Decouple the "+ Add New Product" action from the dropdown selection, using an explicitly separated button and hoisting the modal state.

## 3. Team Settings Feature

- [x] 3.1 Refactor `Settings.tsx` to use a URL-driven tabbed layout (`?tab=general` and `?tab=team`).
- [x] 3.2 Build the Team management UI (member list, invite by email form) for superadmins in the new Team tab.
- [x] 3.3 Build the disabled/upsell view of the Team tab for normal users, integrating the `RequestAccessModal`.

## 4. Integration and Testing

- [x] 4.1 Connect UI to backend API endpoints (invite creation via Firebase Trigger Email extension, redemption via Callable Function).
- [x] 4.2 Add unit and integration tests for role-based rendering (superadmin vs normal user).
- [x] 4.3 Test the "Request Access" flow end-to-end.
