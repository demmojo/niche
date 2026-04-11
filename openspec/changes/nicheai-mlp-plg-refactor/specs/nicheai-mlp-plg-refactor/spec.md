# Spec: NicheAI MLP PLG Refactor

## Feature: Roast My Niche Entry & Adversarial Guards

**Scenario: Preventing Denial of Wallet (DoW)**
- **WHEN** a user requests a roast
- **THEN** the request must pass IP-based Cloudflare WAF / GCP Cloud Armor L7 rate-limiting.
- **AND** it must be validated against Tenant-scoped Firestore Distributed Counters before hitting LLM compute.

**Scenario: Preventing Event Loop Starvation (Payload DoS)**
- **WHEN** the Phase 1 endpoint receives a payload
- **THEN** it MUST enforce `express.json({ limit: '100kb' })`.
- **AND** it MUST immediately return `202 Accepted` with a `jobId` after deterministic internal validation.

**Scenario: Preventing IDOR on Cancellation**
- **WHEN** a user calls the `/cancel` endpoint
- **THEN** the system MUST verify that the authenticated user's `uid` matches the `owner_uid` on the `jobId` document before mutating the status.
- **AND** the active worker/SSE handler listening to that document MUST trigger `ac.abort()` on the LLM.

## Feature: Hybrid Streaming Pattern & Stateful Resume

**Scenario: Periodic State Flushing**
- **WHEN** the Phase 2 SSE handler is streaming tokens to the client
- **THEN** it MUST simultaneously update the document's status (e.g., "analyzing") and flush the aggregated text buffer to Firestore every 3-5 seconds.

**Scenario: Premature Client Disconnect**
- **WHEN** the SSE connection drops (`req.on('close')`)
- **THEN** the server MUST fire an `AbortController` to terminate LLM generation early.
- **AND** it MUST write a final synchronous commit marking status as `aborted_prematurely` with the partial text.

**Scenario: Stateful Resume Generation**
- **WHEN** a user returns to a report marked `aborted_prematurely`
- **THEN** the UI displays the partial state and a "Resume Generation" button.
- **AND** clicking the button initiates a new Phase 2 call passing the partial text, avoiding duplicate token generation costs.

## Feature: Secure Report Delivery (Auth Upgrades)

**Scenario: Resilient Anonymous Account Upgrade**
- **WHEN** an anonymous user attempts to upgrade via OAuth
- **THEN** `getIdToken()` MUST be wrapped in a `try...catch` with exponential backoff and a 5-second circuit breaker.
- **AND** if an `auth/credential-already-in-use` conflict occurs, the system MUST use `linkWithCredential` to smoothly resolve the conflict.