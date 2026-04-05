# Tasks: PLG Architecture & Rate Limit Remediation

## Phase 1: Redis Rate Limiting

- [x] Ensure Redis client is accessible synchronously in API routes (reusing BullMQ connection or separate client). (Fallback: Firestore Distributed Counter)
- [x] Create Redis `INCR` logic for the `global:anon:limit:YYYY-MM-DD` key with a 24-hour TTL. (Fallback implemented)
- [x] Update anon rate limit middleware to use the new Redis counter instead of Firestore.
- [x] Ensure fallback logic exists if Redis connection fails (fail-open or fail-closed based on config).

## Phase 2: Auth SDK Fixes

- [x] Search the codebase for `(auth.currentUser as any).accessToken` and remove it.
- [x] Implement an exponential backoff wrapper for `fetchWithAppCheck` / `getIdToken()`.
- [x] Ensure proper handling of 401s when retries are exhausted.

## Phase 3: Curation Array Boundaries

- [x] Update `CompetitorDiscoveryModal` React component to disable submission if `competitors.length === 0`.
- [x] Add conditional rendering in the modal to show a "Manual Entry" prompt if the array is empty.
- [x] Update the validation schema for `/api/campaign/discover-competitors` to include `.min(1)` on the `competitors` array.
- [x] Write integration tests for empty array API rejection.
- [x] Verify PLG conversion metrics tracking is intact post-updates.
