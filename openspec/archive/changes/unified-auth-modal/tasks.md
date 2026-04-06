## 1. Phase 1: Test Scaffolding (Red Phase)

- [x] 1.1 **Test:** Write failing MSW/RTL intent-based tests in `src/__tests__/components/AuthModal.test.tsx`. Include scenarios for: successful Google auth (`linkWithPopup`), handling `auth/popup-closed-by-user`, and the appearance of the "Merge vs. Discard" prompt **only** when `auth/credential-already-in-use` is thrown.

## 2. Phase 2: Component Implementation (Green Phase)

- [x] 2.1 **Implement:** Create a global `AuthDialogProvider` and `AuthModal` component (`src/components/AuthModal.tsx`).
  - _Must split Context into `AuthStateContext` and `AuthDispatchContext` to prevent render cascades._
  - _Must check if `auth.currentUser` is null/non-anonymous before linking._
  - _Must use `linkWithPopup` as the primary path for anonymous upgrades._
  - _Must call `await auth.currentUser?.reload()` on success._
  - _Must handle `auth/credential-already-in-use` and `auth/email-already-in-use` to trigger the Merge vs Discard view._
  - _Must implement a "Dirty State Check" to skip the prompt if the anonymous session is empty._
  - _Must use Defensive Persistence (`localStorage`) for data migration during a Merge to prevent React unmount data loss._
  - _Must disable the close button while loading to prevent unmounts during active popups._
- [x] 2.2 **Implement:** Integrate `<AuthDialogProvider>` at the root `App.tsx` level, wrapping the router/shell. Update entry points (like PQL gates and headers) to trigger login via this Context.

## 3. Final Phase: Testing & Validation

- [x] 3.1 Verify targeted local coverage (`npm run test -- src/components/AuthModal.tsx src/App.tsx --coverage`) meets the 80-100% threshold.
- [x] 3.2 Visually verify the modal backdrop and transitions to ensure it feels premium and distinct from AI slop.
