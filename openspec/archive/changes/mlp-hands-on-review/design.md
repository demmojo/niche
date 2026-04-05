# Design: MLP Deep Hands-On Product Review

## Context

To prepare for MLP, we need to finalize the product UX from the user's perspective, focusing heavily on eliminating React 19 rendering race conditions, ensuring data integrity during the anonymous-to-auth upgrade, and delivering a flawless PLG sequence.

## Goals

- Implement native Firebase TTLs for session management.
- Guarantee zero data loss during anonymous account transitions.
- Enhance UI responsiveness and stabilize streaming layouts (Anti-CLS).
- Integrate robust prompt injection checks and LLM token limits.

## Non-Goals

- **Undo/History Features:** Complex undo features for binary triage are YAGNI for MLP. Users must regenerate if they discard by mistake.
- **Complex Cloud Task Cancellation Polling:** Replaced by simpler streaming logic.
- **Complex UI Recovery of Partial Streams:** A generic "Try Again" error toast is sufficient for the MLP instead of deep recovery mechanisms.
- **IP Rate Limiting:** Deferred post-MLP if infra is too complex, relying instead on AppCheck and auth limits.

## Decisions

- **Data Lifecycle:** Use native Firestore TTL policies (`expiresAt`) for garbage collection instead of custom cron jobs to prevent race conditions.
- **State Migrations:** Use backend `runTransaction` to securely migrate anonymous data and handle `auth/credential-already-in-use` edge cases during account linking.
- **Partial State Management:** Use `draftData` subcollections in Firestore. Only promote to the live schema atomically upon successful completion.
- **Context Splitting:** Implement `WorkspaceStateContext` and `WorkspaceDispatchContext` to prevent unnecessary re-renders during active SSE streams.
- **Radix UI Portal Z-Index:** Define a root stacking context (`#root { position: relative; z-index: 0; }`) to ensure Radix Tooltip Portals render correctly above modals.

## Risks / Trade-offs

- **Firebase Auth Emulator Discrepancies:** Risk of differing behavior between local auth emulators and production OAuth flows. _Mitigation:_ Explicitly test `isMergingRef` logic using Vitest/Playwright mocks.
- **Gemini API Latency Variations:** Long wait times might make the "Explainable States" feel disjointed. _Mitigation:_ Ensure low-latency metrics (like Exa competitor counts) resolve within 1-2 seconds independently of the LLM.

## Future Potential

Deep IP-based rate limiting for further DoW (Denial of Wallet) protection post-MLP.
