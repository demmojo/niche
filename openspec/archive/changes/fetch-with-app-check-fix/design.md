# Design

## Context

The `fetchWithAppCheck` utility is responsible for attaching Firebase App Check and Authentication tokens to outgoing network requests. When the network is unstable, fetching a fresh ID token can fail, causing the entire fetch operation to throw an unhandled exception.

## Goals & Non-Goals

**Goals:**

- Prevent application crashes when `getIdToken()` fails due to transient network errors.
- Maximize the chance of request success by implementing a robust exponential backoff retry loop.
- Securely handle unmounting React components and user sign-out edge cases.

**Non-Goals:**

- Implementing an offline request queue or global request retry interceptor (out of scope for this specific bug fix).

## Decisions

- **Exponential Backoff:** Wrap the auth token retrieval in a retry loop using exponential backoff with jitter to handle transient `auth/network-request-failed` exceptions safely.
- **Circuit Breaking:** Enforce a maximum of 3 retries or a 5-second max duration. If the threshold is crossed, bubble the error up so the application handles it (e.g., showing an offline state) rather than hanging indefinitely.
- **AbortSignal Integration:** Bind the wait period to an `AbortSignal` so the retry loop aborts immediately if the React component unmounts.
- **State Mutation Awareness:** Check `if (!auth.currentUser)` before each retry to abort if the user signed out mid-retry.
- **Hard Error Bubbling:** Retry _only_ on network failures. Immediately bubble up hard auth errors (e.g., token revoked or user deleted).

## Risks & Trade-offs

- Retrying network requests adds latency (up to 5 seconds). However, this is preferable to a guaranteed failure or the dangerous anti-pattern of using an unreliable cached token. Bubbling up the error after the threshold ensures the UI doesn't hang indefinitely.

## Future Potential

- Add a global request retry interceptor or offline queue for better handling of transient network drops.
