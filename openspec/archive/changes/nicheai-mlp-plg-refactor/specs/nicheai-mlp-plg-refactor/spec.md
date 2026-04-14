# Spec: NicheAI MLP PLG Refactor

## Feature: Roast My Niche Entry & Adversarial Guards

**Scenario: Preventing Denial of Wallet (DoW) & TOCTOU**

- **WHEN** a user requests a roast
- **THEN** volumetric IP-based requests must pass Cloudflare WAF / GCP Cloud Armor L7 rate-limiting.
- **AND** it must be validated against business quotas using atomic Redis `INCR` and `EXPIRE` commands (abandoning Firestore transaction counters) using Firebase Anonymous UIDs AND Application-level Hashed IPs to prevent UID reset exploits.
- **AND** logical quota exhaustion MUST map to a distinct code (`402 Payment Required`) which the frontend intercepts to display an Auth/Upgrade Conversion Modal (preventing auto-retry loops on 429).

**Scenario: Preventing Event Loop Starvation & Idempotent Dispatch**

- **WHEN** the Phase 1 endpoint receives a payload
- **THEN** it MUST enforce `express.json({ limit: '100kb' })` and strict `zod` validation for the `idea` string to prevent NoSQL injection.
- **AND** it MUST NOT extract `owner_uid` from the body, relying exclusively on `req.user.uid` from authenticated middleware to prevent IDOR.
- **AND** it MUST await the initial `db.collection('jobs').doc(jobId).set(...)` creation (with a native `expiresAt` Timestamp for TTL).
- **AND** if the set succeeds, it MUST synchronously await the dispatch of a deterministic Google Cloud Task explicitly naming it `projects/.../tasks/{jobId}` to prevent floating promise task drops during scale-to-zero.
- **AND** it MUST immediately return `202 Accepted` with the `jobId` and a context-accurate message (e.g., "initializing_roast").
- **AND** the invoked Cloud Run worker relies on the Cloud Tasks infrastructure idempotency (and a fast Firestore `runTransaction` check) to guarantee singular execution.

**Scenario: Preventing IDOR on Cancellation**

- **WHEN** a user calls the `/cancel` endpoint
- **THEN** the system MUST verify that the authenticated user's `uid` matches the `owner_uid` on the `jobId` document.
- **AND** the system MUST explicitly write `status: 'cancelled'` to the Firestore ledger.
- **AND** the system MUST publish a cancellation event to a job-specific Redis Pub/Sub channel (`cancel:{jobId}`).
- **AND** the Cloud Task worker MUST listen to this `cancel:{jobId}` channel via the Redis multiplexer to stop LLM inference and save costs, avoiding high-volume Firestore polling and broadcast storms.

## Feature: True Decoupled Execution (Claim-Check) & Sub-Second Stateful Resume

**Scenario: Fast-Ephemeral Sub-Second Observation Layer & Non-Blocking I/O**

- **WHEN** the dedicated Cloud Task worker is streaming tokens from Gemini
- **THEN** it MUST stream the sub-second delta chunks to a fast-ephemeral layer (Redis Pub/Sub).
- **AND** it MUST buffer the full string to flush to the Firestore ledger every 3-5 seconds using a non-blocking `.catch(console.error)` promise to prevent artificial stuttering in the real-time stream.
- **AND** the Phase 2 SSE observation endpoint MUST use a Redis Singleton Multiplexed Subscriber (with `EventEmitter`) to fan out the instant sub-second text updates to connected clients without exhausting Redis connection limits.

**Scenario: Worker Preemption & Lease Safety**

- **WHEN** a worker attempts to claim a job that is already leased (`now < leased_until`)
- **THEN** the worker MUST return `429 Too Many Requests` or `503 Service Unavailable` so Cloud Tasks properly triggers exponential backoff (NOT `200 OK`, which drops the task).
- **AND** if a worker encounters a fatal error during generation, it MUST explicitly release the `leased_until` lock (set to `null`) in its `catch` block before returning `500` to unblock immediate retries.

**Scenario: Graceful Container Shutdown**

- **WHEN** a Cloud Run instance receives a `SIGTERM` (scale-to-zero event)
- **THEN** the application (`server.ts`) MUST gracefully drain the singleton Redis connection and safely intercept active SSE connections or worker streams to prevent data corruption.

**Scenario: Client Disconnect Resiliency**

- **WHEN** the SSE connection drops (`req.on('close')`)
- **THEN** the SSE endpoint merely removes its `EventEmitter` listener for that job.
- **AND** the Cloud Task worker continues its LLM execution unabated to guarantee delivery of the "Reverse Demo Hook" magic.

**Scenario: Stateful Reconnect**

- **WHEN** a user returns to a report they navigated away from
- **THEN** the UI seamlessly fetches the current `fullText` state from Firestore and remounts the SSE observer to Redis.
- **AND** if multi-step generation triggers LLM continuation, it MUST use Gemini Chat History prefilling (`role: model`) to inject previous output context, avoiding massive concatenated string prompts and preventing hallucination.

## Feature: Secure Report Delivery & Orphan Handling

**Scenario: Anonymous to Permanent Account Upgrade (Auth Collision)**

- **WHEN** an anonymous user upgrades to an existing Google/GitHub account (`auth/credential-already-in-use` fallback)
- **THEN** the frontend MUST rely strictly on `linkWithPopup` to upgrade the session, preserving the UID.
- **AND** if a collision occurs, it extracts the credential to `signInWithCredential`. We explicitly reject complex IDOR-prone bulk UID reassignment; any jobs from the anonymous session are gracefully orphaned.

**Scenario: TTL Urgency Driver & Logical Expiration for Anonymous Users**

- **WHEN** an anonymous user views a generated report
- **THEN** the UI MUST display a countdown banner based on the Firestore `expiresAt` Timestamp.
- **AND** the system MUST enforce logical expiration (`expiresAt < now()`) in queries and Security Rules to prevent accessing stale data before the 72h physical sweeper runs.
- **AND** the banner MUST prompt the user to create a free account to save the report permanently.

**Scenario: Resilient Anonymous Account Upgrade**

- **WHEN** an anonymous user attempts to upgrade via OAuth
- **THEN** `getIdToken()` MUST be wrapped in a `try...catch` with exponential backoff and a 5-second circuit breaker, bound to an `AbortSignal` to prevent unmounted component leaks.
- **AND** if an `auth/credential-already-in-use` conflict occurs, the system MUST extract the credential and use `signInWithCredential` to smoothly resolve the conflict.

## Feature: Frontend Resilience & Edge Cases

**Scenario: Main Thread Stability During Large Streams**

- **WHEN** the frontend receives massive markdown string updates via the SSE observer
- **THEN** the UI MUST sanitize the content via `DOMPurify`.
- **AND** the React component MUST use React 19's `useDeferredValue` for the sanitized markdown to allow concurrent rendering and prevent $O(N^2)$ Main Thread freezing.

**Scenario: Superadmin Queue Offline Resilience**

- **WHEN** a superadmin modifies the state of a pending roast queue
- **THEN** the React 19 concurrent rendering pipeline MUST order local state updates before initiating the async `setDoc` call to prevent offline UI freezing.
