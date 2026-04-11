# Spec: NicheAI MLP PLG Refactor

## Feature: Roast My Niche Entry & Adversarial Guards

**Scenario: Preventing Denial of Wallet (DoW) & TOCTOU**

- **WHEN** a user requests a roast
- **THEN** volumetric IP-based requests must pass Cloudflare WAF / GCP Cloud Armor L7 rate-limiting.
- **AND** it must be validated against business quotas via Firestore Transactions using Firebase Anonymous UIDs AND Application-level Hashed IPs to prevent UID reset exploits.
- **AND** Firestore contention (`DEADLINE_EXCEEDED`) MUST be caught and mapped to a polite 429/503 "System Busy" toast.
- **AND** logical quota exhaustion MUST map to a distinct code (e.g. 402) which the frontend intercepts to display an Auth/Upgrade Conversion Modal.

**Scenario: Preventing Event Loop Starvation & Idempotent Dispatch**

- **WHEN** the Phase 1 endpoint receives a payload
- **THEN** it MUST enforce `express.json({ limit: '100kb' })`.
- **AND** it MUST await the initial `db.collection('jobs').doc(jobId).set(...)` creation (with a native `expiresAt` Timestamp for TTL).
- **AND** if the set succeeds, it MUST dispatch a Google Cloud Task passing the `jobId`.
- **AND** it MUST immediately return `202 Accepted` with the `jobId`.
- **AND** the invoked Cloud Run worker MUST idempotently claim the job using `runTransaction` (checking `status === 'pending'` or checking a `leased_until` timestamp) to prevent deadlocks on Cloud Tasks retries.

**Scenario: Preventing IDOR on Cancellation**

- **WHEN** a user calls the `/cancel` endpoint
- **THEN** the system MUST verify that the authenticated user's `uid` matches the `owner_uid` on the `jobId` document.
- **AND** the system MUST explicitly write `status: 'cancelled'` to the Firestore ledger.
- **AND** the Cloud Task worker MUST periodically check this status or use a bound `AbortSignal` to stop LLM inference and save costs.

## Feature: True Decoupled Execution (Claim-Check) & Sub-Second Stateful Resume

**Scenario: Fast-Ephemeral Sub-Second Observation Layer**

- **WHEN** the dedicated Cloud Task worker is streaming tokens from Gemini
- **THEN** it MUST stream the sub-second delta chunks to a fast-ephemeral layer (like Redis Pub/Sub) AND buffer the full string to flush to the Firestore ledger every 3-5 seconds.
- **AND** the Phase 2 SSE observation endpoint MUST subscribe to the Redis channel for instant sub-second text updates, preventing jarring 5-second chunk blocks.

**Scenario: Client Disconnect Resiliency**

- **WHEN** the SSE connection drops (`req.on('close')`)
- **THEN** the SSE endpoint merely calls `unsubscribe()` to close the Redis and Firestore listeners.
- **AND** the Cloud Task worker continues its LLM execution unabated to guarantee delivery of the "Reverse Demo Hook" magic.

**Scenario: Stateful Reconnect**

- **WHEN** a user returns to a report they navigated away from
- **THEN** the UI seamlessly fetches the current `fullText` state from Firestore and remounts the SSE observer to Redis.
- **AND** if multi-step generation triggers LLM continuation, it MUST use Gemini Chat History prefilling (`role: model`) to inject previous output context, avoiding massive concatenated string prompts and preventing hallucination.

## Feature: Secure Report Delivery & Orphan Prevention

**Scenario: Anonymous to Permanent Account Upgrade (Auth Collision)**

- **WHEN** an anonymous user upgrades to an existing Google/GitHub account (`auth/credential-already-in-use` fallback)
- **THEN** the backend MUST execute a hook to reassign `owner_uid` on all `jobs` generated during the anonymous session to the new permanent UID.
- **AND** this prevents the user from permanently losing access to their reports after a successful Reverse Demo Hook conversion.

**Scenario: TTL Urgency Driver & Logical Expiration for Anonymous Users**

- **WHEN** an anonymous user views a generated report
- **THEN** the UI MUST display a countdown banner based on the Firestore `expiresAt` Timestamp.
- **AND** the system MUST enforce logical expiration (`expiresAt < now()`) in queries and Security Rules to prevent accessing stale data before the 72h physical sweeper runs.
- **AND** the banner MUST prompt the user to create a free account to save the report permanently.

**Scenario: Resilient Anonymous Account Upgrade**

- **WHEN** an anonymous user attempts to upgrade via OAuth
- **THEN** `getIdToken()` MUST be wrapped in a `try...catch` with exponential backoff and a 5-second circuit breaker.
- **AND** if an `auth/credential-already-in-use` conflict occurs, the system MUST use `linkWithCredential` to smoothly resolve the conflict.
