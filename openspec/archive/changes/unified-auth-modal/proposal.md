## Why

NicheAI utilizes an anonymous-first "Reverse Demo Hook". Users begin generating value immediately without an auth wall. However, returning users or those wishing to explicitly log in face a "Data Loss Trap" if redirected to a standalone `/login` page: navigating away from the workspace destroys their anonymous session context.

We need a unified authentication mechanism that securely authenticates users _in-context_ without destroying their background state. We must prioritize "Silent Claiming" for new users, and gracefully handle "Merge vs. Discard" resolution for returning users who encounter credential collisions.

## What Changes

- Introduce a contextual `<AuthModal />` hoisted at the root (`App.tsx`) via a React Portal/Context to avoid layout coupling and z-index clipping.
- Implement robust Firebase Authentication utilizing `linkWithPopup` to seamlessly upgrade anonymous accounts ("Silent Claiming").
- Introduce a "Merge vs. Discard" data resolution prompt **only** as an error-recovery path when returning users encounter `auth/credential-already-in-use`.

## Capabilities

### New Capabilities

- `unified-auth-modal`: A global, contextual auth overlay that preserves background state.
- `auth-data-resolution`: A fallback flow to prompt the user to merge or discard anonymous workspace data upon an account collision.

### Modified Capabilities

- `app-bootstrap`: Revert standalone routing attempts and ensure all authentication triggers invoke the unified modal via a global Context provider.
