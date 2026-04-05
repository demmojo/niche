# Plan: Fetch With App Check Fix

## 1. Description

Bug fix for `Firebase: Error (auth/network-request-failed)` in `fetchWithAppCheck.ts`. The `auth.currentUser.getIdToken()` call was previously failing ungracefully during intermittent network issues. The fix wraps this call in a `try/catch` block to gracefully degrade by falling back to the cached `accessToken` if available, or continuing without the `Authorization` header rather than crashing the frontend application.

## 2. Technical Strategy

- Modify `src/utils/fetchWithAppCheck.ts` to wrap `auth.currentUser.getIdToken()` in a `try/catch`.
- If `getIdToken` throws a network error, log the error and gracefully degrade.
- Implement a fallback to `(auth.currentUser as any).accessToken` to attempt using the cached token.
- If no token is available, proceed without adding the `Authorization` header, preventing unhandled promise rejections on the client.
- Update/add tests in `src/__tests__/utils/fetchWithAppCheck.test.ts` to mock the network failure and verify the graceful degradation behavior.

## 3. Scope

- `src/utils/fetchWithAppCheck.ts`
- `src/__tests__/utils/fetchWithAppCheck.test.ts`

## 4. Acceptance Criteria

- `fetchWithAppCheck` no longer throws an unhandled exception when `getIdToken` fails due to network errors.
- The request gracefully continues using a cached token if possible, or without authorization if not.
- Tests verify the fallback behavior and ensure the application remains stable during intermittent network failures.
