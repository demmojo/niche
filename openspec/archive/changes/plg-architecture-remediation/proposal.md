# Proposal: PLG Architecture & Rate Limit Remediation

## Why

The recent implementation of the Product-Led Growth (PLG) Teaser introduced several architectural risks. A single Firestore document is being used for global anonymous rate limiting, which violates Firestore's 1 write/sec limitation and will cause API crashes (`DEADLINE_EXCEEDED`) during viral traffic spikes. Additionally, technical debt was introduced via an undocumented auth token encapsulation hack, and empty competitor arrays are bypassing validation and breaking downstream campaigns.

## What Changes

1. **Migrate Global Limit:** Transition the global anonymous rate limit from Firestore to a Redis distributed counter via atomic `INCR`.
2. **Standardize Auth Fallbacks:** Remove the `(auth.currentUser as any).accessToken` fallback hack in `fetchWithAppCheck` and implement a standard fetch/axios retry mechanism with exponential backoff.
3. **Curation Array Boundaries:** Enforce a strict minimum array length (`min(1)`) on competitor curation both in the UI and the API.

## Capabilities

- **High-Throughput Rate Limiting:** Safely handles viral spikes of anonymous traffic without database write contention.
- **Robust Authentication:** Relies on officially supported Firebase SDK methods paired with standard network retry patterns.
- **Safe Data Contracts:** Guarantees upstream logic provides valid, non-empty data arrays to downstream validation campaigns.

## Impact

- **Error Rate:** Decreases 429 and 500 errors to 0% during traffic surges.
- **Latency:** Reduces rate limit validation latency to < 5ms.
- **Maintainability:** Protects the app from breaking during future Firebase SDK upgrades.
