# Implementation Tasks

## Phase 1: Component Scaffold & Explainable States

- [x] Define the `AuthMergeState` TypeScript enum.
- [x] Build the `<ExplainableLoader>` component mapped to state enum strings.
- [x] Implement `aria-live="polite"` accessibility for state transitions.
- [x] Implement the Error Recovery UX ("Retry Sync" button) in the loader.
- [x] Replace TTL punitive banners with the Value-Preservation Banner.
- [x] Implement the Optimistic UI Gate mapping to `isStreaming` state.

## Phase 2: Secure Backend Merge

- [x] Create a Cloud Function endpoint to generate a single-use Cryptographic Claim Ticket (JWT).
- [x] Build the backend Cloud Function `executeMerge` to receive and validate the Claim Ticket.
- [x] Implement `Firestore.writeBatch` logic inside `executeMerge` to append anonymous data to the new permanent user record safely.

## Phase 3: Global Context & Rehydration

- [x] Extend `WorkspaceProvider` (or equivalent) to manage `AuthMergeState` globally.
- [x] Implement save/load logic tying the state machine to `sessionStorage`.
- [x] Wire the frontend "Save Workspace" trigger to handle button de-duplication (atomic `isSubmitting` flags, pointer-events none).

## Phase 4: Auth Flow & Fallbacks

- [x] Implement environment detection logic to route between `linkWithPopup` and `linkWithRedirect`.
- [x] Implement `linkWithPopup` Google/GitHub providers.
- [x] Implement `linkWithRedirect` resolution (`getRedirectResult()`) on app mount.
- [x] Add explicit `catch` block handling for `auth/credential-already-in-use`.
- [x] Add explicit `catch` block handling for `auth/account-exists-with-different-credential`.

## Phase 5: CI/CD & Testing

- [x] Setup Playwright E2E tests for the merge pipeline.
- [x] Implement `page.route` mocks to bypass headless popup hanging issues.
