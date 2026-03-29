# Design: Reverse Demo Hook PLG

## Context

The transition from a traditional SaaS sign-up flow to a PLG "Reverse Demo" requires architectural adjustments in authentication, data storage, and React state management to maintain security and UX standards defined in `.cursor/rules/frontend-growth-plg.mdc`.

## Goals

- Eliminate user-facing friction prior to core value delivery.
- Securely migrate data from an anonymous session to a permanent account upon conversion.
- Provide a smooth, flicker-free UX during auth state transitions.
- Facilitate viral sharing of generated output.
- Prevent ballooning Firebase operational costs from anonymous data.

## Non-Goals

- Redesigning the underlying ML scoring algorithms or AI strategy engine (only updating orchestration).
- Full collaboration/multiplayer editing (shared links are read-only triggers for the acquisition loop).

## Decisions

- **Dual-Token Verification:** To prevent IDOR (Insecure Direct Object Reference) attacks during account merging, clients will pass both the anonymous JWT and the permanent JWT to `/api/auth/merge-anonymous-data`. The backend validates both to prove ownership before executing document reparenting.
- **LocalStorage Fallback:** In the event the backend merge transaction fails during an `auth/credential-already-in-use` collision, the anonymous UID and payload are stored in `localStorage` to attempt safe recovery.
- **React 19 Hooks:** Utilizing `useActionState` and `useOptimistic` to prevent the "Snapshot Beats the Fetch" race condition, avoiding the UI violently flickering to an empty logged-out state during the `signInAnonymously` network request.
- **Async Orchestration (202 Accepted):** All background processing endpoints will immediately return a `202` and a `jobId`. The client subscribes via Firestore `onSnapshot` to render Explainable States with `aria-live="polite"`.

## Risks/Trade-offs

- **Risk:** Firebase Auth limit exhaustion and Firestore bloat from bot traffic.
  - **Mitigation:** Strict TTL Cron job deleting anonymous records older than 7 days, combined with Firebase App Check (reCAPTCHA v3) middleware on unauthenticated endpoints.
- **Risk:** Concurrent data corruption during account linking.
  - **Mitigation:** Use `firestoreInstance.runTransaction` for absolute atomicity when reparenting collections.

## Future Potential

The anonymous payload structure could be extended to track behavioral metrics pre-signup, creating highly personalized "magic link" remarketing campaigns.
