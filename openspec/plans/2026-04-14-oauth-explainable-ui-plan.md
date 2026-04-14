---
title: OAuth Migration & Explainable UI Refactor
status: draft
dependencies: []
extends: [nicheai-frontend-streaming]
reverts: []
---

# Plan: OAuth Migration & Explainable UI Refactor

## 1. Executive Summary

This plan proposes a high-leverage PLG refactor focusing on the "Reverse Demo Hook". It replaces context-breaking Magic Links with standard OAuth (Google/GitHub) for upgrading anonymous accounts. It also replaces generic loading spinners with state-driven "Explainable States" to reduce anxiety and transforms punitive TTL urgency drivers into value-preserving messaging.

## 2. Motivation

Magic Links force an app-switch that kills conversion momentum, especially on mobile social feeds. Generic loaders erode trust during the 5-15s identity merge window. By moving to in-context OAuth (`linkWithPopup` with `linkWithRedirect` fallbacks) and pairing it with an event-driven `ExplainableLoader`, we dramatically decrease time-to-authenticated and improve UX.

## 3. Scope and Requirements

### 3.1 In Scope

- **OAuth Migration:** Implement Google/GitHub OAuth via `linkWithPopup`. Implement environment detection to fallback to `linkWithRedirect` for mobile in-app browsers and strict-ITP environments (Safari).
- **Conflict Resolution:** Gracefully handle `auth/credential-already-in-use` and `auth/account-exists-with-different-credential`.
- **Secure Merge Grant (Cryptographic Claim Ticket):** Implement a backend-verified atomic data merge process (`writeBatch`) requiring a cryptographic chain-of-custody token. Anonymous workspaces are _appended_, not overwritten.
- **Persistent State Machine:** Rehydrate auth merge state from `sessionStorage` to survive hard browser redirects.
- **Explainable States:** Implement `<ExplainableLoader>` driven by real auth/merge state machine transitions. Include explicit Error Recovery UX.
- **Value-Driven Urgency:** Implement an urgency banner framed around preserving generated AI value, removing any artificial 24-hour data deletion scripts.

### 3.2 Out of Scope

- Changes to backend AI generation pipelines (handled by `nicheai-frontend-streaming`).
- Migration of existing users authenticated via Magic Links.

## 4. Technical Design

### 4.1 Authentication & Secure Merge Flow (The PQL Gate)

To prevent IDOR vulnerabilities and survive `linkWithRedirect` amnesia, the merge follows a "Cryptographic Claim Check" pattern lifted into a global React Context (`WorkspaceProvider` or `AuthProvider`):

1. **Optimistic UI Gate:** If an AI generation is actively streaming (`isStreaming === true`), the "Save Workspace" action is disabled or queued to prevent attempting to hand over an active SSE connection mid-auth-swap.
2. **Secure Merge Grant:** While still authenticated as `anon_uid`, the frontend calls a Cloud Function to generate an intent-to-merge. The backend returns a **single-use cryptographic Claim Ticket** (e.g., a signed JWT).
3. **State Persistence:** The frontend persists the Claim Ticket, `anon_uid`, and current `AuthMergeState` to `sessionStorage` (or `localStorage`).
4. **Execute Auth Swap:** Trigger `linkWithPopup` (or `linkWithRedirect` if WebView).
   - If using `linkWithRedirect`, the global provider rehydrates the state machine from `sessionStorage` upon initialization via `getRedirectResult()`.
   - _Conflict Handling A (`credential-already-in-use`):_ Extract credential, call `signInWithCredential`.
   - _Conflict Handling B (`account-exists-with-different-credential`):_ Prompt user to sign in with their original provider (e.g., GitHub).
5. **Atomic Backend Merge:** After successful login (now authenticated as `permanent_uid`), the global context calls `executeMerge`, passing the Claim Ticket to prove chain-of-custody. The backend verifies the ticket and uses `Firestore.writeBatch` to atomically append the anonymous workspace to the permanent account.
6. **Deduplication:** The trigger button sets an atomic `isSubmitting` flag and disables pointer events to prevent double-click collisions.

### 4.2 Explainable States Architecture

Create a reusable `<ExplainableLoader>` component that accepts a strict state enum:

```tsx
type AuthMergeState =
  | "IDLE"
  | "REQUESTING_GRANT"
  | "AWAITING_OAUTH"
  | "RESOLVING_CONFLICT"
  | "EXECUTING_MERGE"
  | "SUCCESS"
  | "ERROR";
// The UI renders descriptive text ("Securing workspace...", "Authenticating with Google...", "Saving data...") based on the actual enum, utilizing aria-live="polite".
```

**Error Recovery UX:** If the state reaches `ERROR` (e.g., the auth swap succeeded but the backend `executeMerge` dropped due to network failure), the UI provides a explicit "Retry Sync" action that re-fires the `executeMerge` payload using the cached Claim Ticket, preventing permanent data abandonment.

## 5. Implementation Phases

- **Phase 1: Component Scaffold & Explainable States.** Build `<ExplainableLoader>` (including Error Recovery UX) and the Value-Preservation Banner. Implement the Optimistic UI Gate.
- **Phase 2: Secure Backend Merge.** Implement the Cloud Functions for the Cryptographic Claim Ticket and atomic `writeBatch` append.
- **Phase 3: Global Context & Rehydration.** Wire the state machine into the global provider, including `sessionStorage` persistence and rehydration logic.
- **Phase 4: Auth Flow & Fallbacks.** Implement `linkWithPopup`/`linkWithRedirect`, environment detection, and comprehensive conflict resolution (`catch` blocks).

## 6. Risks and Mitigations

- **CI/CD Headless Testing:** Firebase Auth Emulators and OAuth popups hang in Node 18 headless environments. _Mitigation:_ E2E tests must use Playwright's `page.route` to mock the OAuth credential payload instead of interacting with a real popup.
