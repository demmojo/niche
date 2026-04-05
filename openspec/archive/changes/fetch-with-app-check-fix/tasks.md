# Tasks

## Phase 1: Implementation

- [ ] Modify `src/utils/fetchWithAppCheck.ts`.
- [ ] Implement an exponential backoff retry loop around `auth.currentUser.getIdToken()`.
- [ ] Ensure the retry loop checks `if (!auth.currentUser)` before each attempt to abort if the user signed out mid-retry.
- [ ] Make the fetch accept an `AbortSignal` and listen to `signal.onabort` (or check `signal.aborted`) to break the retry loop if the React component unmounts.
- [ ] In the `catch` block, inspect the error. Retry _only_ if the error is a transient network failure (`auth/network-request-failed` or 5xx equivalent). If it is a hard auth error (e.g. `auth/user-token-expired`, `auth/user-disabled`), immediately break the loop and bubble the error.
- [ ] Implement a circuit breaker: restrict to a max of 3 retries or a 5-second total duration. If the threshold is crossed, bubble the error up so the global auth provider can catch it and log the user out / show offline state.

## Phase 2: Testing

- [ ] Modify `src/__tests__/utils/fetchWithAppCheck.test.ts`.
- [ ] Add a test mocking `getIdToken` to reject with a transient network error, ensuring it retries and succeeds if a subsequent call succeeds.
- [ ] Add a test verifying the circuit breaker trips (bubbles up error) after 3 consecutive failures.
- [ ] Add a test verifying that hard auth errors (e.g., `auth/user-token-expired`) are NOT retried and immediately thrown.
- [ ] Add a test verifying that the retry loop aborts immediately if the `AbortSignal` is aborted.
