# Spec: PLG Architecture & Rate Limit Remediation

## 1. Scalable Rate Limiting

**Feature:** Replace atomic Firestore writes for global anonymous limits with an atomic Redis counter.

- **Scenario: High-Concurrency Anonymous Traffic**
  - **WHEN** 1,000 anonymous requests hit the `/api/campaign/generate` endpoint concurrently.
  - **THEN** the Redis `INCR` command tracks usage accurately without lock contention or `DEADLINE_EXCEEDED` errors.
  - **AND** latency for the rate limit check remains under 5ms.
- **Scenario: Rate Limit Exceeded**
  - **WHEN** the Redis counter exceeds the daily threshold.
  - **THEN** the API returns a standard `429 Too Many Requests` response.

## 2. Standardized Auth Token Retry

**Feature:** Secure, encapsulated fetching of Firebase auth tokens with resilience against transient network drops.

- **Scenario: Transient Network Drop during Fetch**
  - **WHEN** `getIdToken(false)` fails due to a temporary network issue.
  - **THEN** the wrapper applies an exponential backoff retry rather than accessing undocumented SDK properties.
- **Scenario: Hard Expiration / Persistent Failure**
  - **WHEN** `getIdToken()` persistently fails after retries.
  - **THEN** the application throws a standard auth error or 401, triggering a graceful re-authentication prompt.

## 3. Curation Array Enforcement

**Feature:** Enforcing non-empty bounds on HitL competitor discovery.

- **Scenario: User Removes All Auto-Discovered Competitors**
  - **WHEN** a user is in the `CompetitorDiscoveryModal` and removes all suggested items.
  - **THEN** the "Confirm" button is disabled.
  - **AND** a fallback prompt appears urging manual entry.
- **Scenario: API Receives Empty Array**
  - **WHEN** a malformed client submits `{ competitors: [] }` to `/api/campaign/discover-competitors`.
  - **THEN** the backend Zod validation catches it and returns a `400 Bad Request` with message `"Array must contain at least 1 element(s)"`.
