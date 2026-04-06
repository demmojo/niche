## Context

The previous approach (`explicit-login-page`) relied on a hard redirect that inherently destroyed anonymous PLG state. It also incorrectly applied account upgrade logic (`linkWithPopup`) to account switching logic. This spec resolves those critical architectural flaws by moving to a global portal and a "Silent Claiming" default.

## Goals / Non-Goals

**Goals:**

- Provide a contextual `AuthModal` hoisted at the root via `<AuthDialogProvider>` to keep generated data visible as a psychological anchor and avoid `WorkspaceShell` unmount race conditions.
- Handle standard authentication (Google OAuth, Email/Password) primarily via `linkWithPopup` to upgrade anonymous users seamlessly ("Silent Claiming").
- Respect native interactive popups (no artificial timeouts for popups, listen for `auth/popup-closed-by-user` and `auth/popup-blocked`).
- Prompt the user to "Merge or Discard" anonymous data **only** if we encounter `auth/credential-already-in-use` (i.e., a returning user).
- Use modern React 18+ patterns (`AbortController`) to guard state updates and prevent memory leaks.

**Non-Goals:**

- A standalone `/login` route.
- Complex enterprise SSO integration (SAML/Okta).
- Automated silent data merging across different UIDs without user consent.

## Decisions

**1. Global Portal over Shell Component**

- **Decision**: Render `<AuthModal />` via a React Portal at the `App.tsx` root, controlled by a global Context split into `AuthStateContext` and `AuthDispatchContext`.
- **Rationale**: Splitting the context prevents full-app render cascades. The portal decouples auth from `WorkspaceShell` layout, preventing `z-index` clipping and SPA hard-redirects.

**2. Silent Claiming via `linkWithPopup`**

- **Decision**: The primary path for anonymous users is `linkWithPopup`. (Must fallback to `signInWithPopup` if `auth.currentUser` is null or non-anonymous). Must call `reload()` afterwards.
- **Rationale**: This seamlessly attaches the credential to the current anonymous UID, requiring zero database migrations. The user sees a "Saved!" success state and keeps working.

**3. Error-Recovery Data Resolution (Merge vs. Discard)**

- **Decision**: If `linkWithPopup` fails with `auth/credential-already-in-use` (or `email-already-in-use`), transition the modal to a "Data Conflict" view. **Crucially, if the anonymous session is empty (no data generated), silently discard it and log them in without prompting.**
- **Rationale**: Explicitly prevents silent data loss for returning users, but avoids penalizing returning users who log in immediately before generating any ideas.

**4. Interactive Popup Resilience**

- **Decision**: Remove the 5-second circuit breaker from popup invocations. Disable the modal's close button while loading.
- **Rationale**: Interactive Google OAuth popups require human interaction. Disabling the close button prevents the user from unmounting the React component while the background Firebase popup is still pending.

**5. Defensive Persistence for Client-Side Merge**

- **Decision**: If the user selects "Merge", serialize the anonymous data to `localStorage` before calling `signInWithCredential`.
- **Rationale**: Calling `signInWithCredential` immediately swaps the global UID, which will cause `WorkspaceShell` to re-render or unmount. Relying on React state to hold the "cached data" during this swap will cause data loss. `localStorage` survives the React tree hydration.

## Risks / Trade-offs

- **Risk: Complex State Management during Merge** -> Merging anonymous data into an established account requires extracting the credential (`OAuthProvider.credentialFromError`), caching local data, calling `signInWithCredential`, and then migrating data.
- **Mitigation**: The migration logic should be isolated.

## Future Potential & Wow Features

- **Backend-Driven Transactional Merges**: Move the client-side data migration into a secure Firebase Callable Function using `runTransaction`.
- **Passwordless Magic Links**: Introduce email magic links within the modal.
