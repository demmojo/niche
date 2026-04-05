# Spec

## Detailed Features

### Robust Token Fetch with Exponential Backoff

The core functionality of `fetchWithAppCheck` must ensure that network requests are resilient to transient Firebase Auth network request failures, without relying on undocumented or unsafe internal token properties. It must correctly handle React unmounting, user sign-out, and circuit breaking.

## Scenarios

**Scenario 1: Successful Token Retrieval**

- **WHEN** a network request is initiated and `auth.currentUser.getIdToken()` succeeds.
- **THEN** the `Authorization` header is populated with `Bearer <token>`.

**Scenario 2: Transient Network Failure (Retry Succeeds)**

- **WHEN** `getIdToken()` throws a transient network error (e.g., `auth/network-request-failed`).
- **THEN** the utility waits using exponential backoff and retries.
- **AND** if the retry succeeds, the request proceeds with the fresh token.

**Scenario 3: Transient Network Failure (Circuit Breaker Trips)**

- **WHEN** `getIdToken()` throws a transient network error continuously.
- **THEN** the utility retries up to 3 times (or 5 seconds max duration).
- **AND** upon exceeding the threshold, the loop breaks and bubbles up the error to be handled by the application state.

**Scenario 4: Component Unmounts Mid-Retry**

- **WHEN** the utility is in an exponential backoff wait state.
- **AND** the passed `AbortSignal` is aborted.
- **THEN** the retry loop aborts immediately and throws an `AbortError`.

**Scenario 5: User Signs Out Mid-Retry**

- **WHEN** the utility is in an exponential backoff wait state.
- **AND** `auth.currentUser` becomes null.
- **THEN** the retry loop aborts immediately and throws an unauthenticated error.

**Scenario 6: Hard Auth Error**

- **WHEN** `getIdToken()` throws a hard error (e.g., `auth/user-token-expired` or `auth/user-disabled`).
- **THEN** the utility does _not_ retry.
- **AND** the error is immediately bubbled up.
