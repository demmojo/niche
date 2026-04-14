# Design: OAuth Migration & Secure Merge

## Context

This feature represents a high-leverage PLG (Product-Led Growth) refactor focusing on the "Reverse Demo Hook." Transitioning an anonymous session with generated value to a durable account is the most critical conversion point in the application. Any friction or uncertainty here results in immediate drop-off.

## Goals

- Implement `linkWithPopup` and `linkWithRedirect` fallbacks for OAuth.
- Ensure bulletproof secure backend merging of anonymous to permanent workspaces.
- Create a strongly-typed `AuthMergeState` machine to drive a transparent UI.
- Gracefully handle auth conflicts (e.g., existing accounts).

## Non-Goals

- Modifying backend AI generation pipelines.
- Migrating existing magic-link authenticated users to OAuth.

## Decisions

1. **Cryptographic Claim Check Pattern:** To prevent IDOR (Insecure Direct Object Reference) vulnerabilities, the frontend will request a single-use signed JWT (Claim Ticket) from a Cloud Function while still authenticated as `anon_uid`.
2. **State Rehydration:** Auth merge states, `anon_uid`, and the Claim Ticket will be stored in `sessionStorage`. If the app undergoes a hard redirect (mobile WebView fallback), the global `WorkspaceProvider` will rehydrate this state on initialization.
3. **Optimistic UI Gate:** Save actions will be disabled or queued if an AI generation is actively streaming (`isStreaming === true`) to prevent severing active SSE connections.
4. **Atomic Backend Append:** The backend verification step will strictly _append_ anonymous data via `Firestore.writeBatch` rather than overwriting, ensuring no permanent data loss.

## Risks and Trade-offs

- **Headless CI/CD Testing:** Firebase Auth emulators and popups routinely hang in Node 18 headless CI environments.
  _Mitigation:_ E2E test suites (e.g., Playwright) will bypass real popups and instead use `page.route` to mock the OAuth credential payload directly.
- **Network Drops during Merge:** If the auth succeeds but the backend payload drops, users could be stranded.
  _Mitigation:_ An explicit `ERROR` state will present a "Retry Sync" action that re-fires the `executeMerge` command using the cached Claim Ticket.

## Future Potential

The Claim Ticket architecture completely abstracts the identity provider. It will easily support adding Apple, Microsoft, or SAML SSO in the future with zero changes to the underlying merge infrastructure.
