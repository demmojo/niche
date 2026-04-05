# Proposal

## Why

Currently, `fetchWithAppCheck.ts` crashes the frontend application during intermittent network issues. The `auth.currentUser.getIdToken()` call fails ungracefully with a `Firebase: Error (auth/network-request-failed)` exception, leading to unhandled promise rejections.

## What Changes

The `getIdToken()` call will be wrapped in a robust exponential backoff retry utility rather than relying on the undocumented and unreliable `(auth.currentUser as any).accessToken` anti-pattern.

The implementation will address four specific edge cases:

1. **User Mutation:** Checking if the user signed out mid-retry to abort the loop.
2. **React Unmounting:** Binding the wait period to an `AbortSignal` so the retry loop aborts if the component unmounts.
3. **Transient vs Hard Errors:** Retrying only on network failures, but immediately bubbling up hard auth errors (e.g., token revoked or user deleted).
4. **Circuit Breaking:** Enforcing a maximum retry count (e.g., 3 retries) or a 5-second max duration to prevent infinite loops, bubbling up the error if the circuit breaker trips.

## Capabilities

- Graceful degradation during network failures via robust retries.
- Prevention of UI hanging through strict circuit breaking and React unmount awareness.

## Impact

- Prevents unhandled promise rejections and subsequent app crashes on the client.
- Improves overall application resilience and user experience during spotty network connectivity, strictly adhering to AGENTS.md best practices.
