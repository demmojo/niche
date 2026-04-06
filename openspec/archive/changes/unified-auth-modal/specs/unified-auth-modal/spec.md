# Unified Auth Modal

Introduce a global, in-context authentication overlay that prioritizes "Silent Claiming" of anonymous PLG data and provides explicit data resolution only upon account collisions.

## Features

### 1. Unified Auth Modal Component (`AuthModal.tsx`)

- **Requirement:** A contextual modal hoisted via React Portal/Context at the `App.tsx` root.
  - Must use a visually distinct backdrop that keeps the underlying workspace visible.
  - A Google OAuth button and Email/Password form.
  - **Explainable AI States:** Loading states must use descriptive text with `aria-live="polite"`.
  - Inline error messages.

### 2. Authentication Logic ("Silent Claiming")

- **Requirement:**
  - Verify `auth.currentUser` exists and `isAnonymous` is true. If not, fallback to `signInWithPopup`.
  - Execute `linkWithPopup(auth.currentUser, googleProvider)` for Google to seamlessly upgrade anonymous users.
  - Execute `linkWithCredential` (or equivalent) for Email.
  - **Hydration:** MUST call `await auth.currentUser?.reload()` immediately after a successful link to refresh Custom Claims and Context.
  - Listen for `auth/popup-closed-by-user`, `auth/popup-blocked`, and `auth/cancelled-popup-request` and handle them gracefully.
  - **Lock Unmount:** Disable the modal's close button while loading is true to prevent unmounting during a background popup. Use `AbortController.signal` to guard state setters.

### 3. Merge vs. Discard Error Recovery

- **Requirement:** If `linkWithPopup` throws `auth/credential-already-in-use` (Google) or `auth/email-already-in-use` (Email), transition to a resolution view.
  - **Extract Credential:** For Google, use `GoogleAuthProvider.credentialFromError`. For Email, recreate it with `EmailAuthProvider.credential(email, password)`.
  - **Dirty State Check:** If the current anonymous session has NO generated data (empty workspace), skip the prompt entirely, call `signInWithCredential` (Discard), and log them in.
  - If dirty data exists, show options: "Merge into my account" or "Discard unsaved work".
  - If Discard: call `signInWithCredential`.
  - If Merge:
    - **Defensive Persistence:** Serialize and persist the anonymous data to `localStorage` (e.g. `nicheai_pending_merge`).
    - Call `signInWithCredential` to switch accounts.
    - Let the tree re-hydrate, then perform the Firestore migration reading from `localStorage`, and clear it.

## Scenarios

- **WHEN** a user triggers the login flow
- **THEN** the `AuthModal` appears, preserving the workspace behind it.

- **WHEN** an anonymous user clicks "Sign in with Google" and successfully links
- **THEN** the system upgrades their account in-place ("Silent Claiming") and closes the modal without prompting.

- **WHEN** an anonymous user clicks "Sign in with Google" and they already have an account
- **THEN** the system catches `auth/credential-already-in-use` and transitions to the "Merge vs. Discard" view.

- **WHEN** a user clicks "Sign in with Google" and closes the popup window
- **THEN** the system catches `auth/popup-closed-by-user`, resets the loading state, and keeps the modal open.

- **WHEN** the user selects "Merge" on the conflict view
- **THEN** the system logs them in via `signInWithCredential`, synchronizes the data, and closes the modal.
