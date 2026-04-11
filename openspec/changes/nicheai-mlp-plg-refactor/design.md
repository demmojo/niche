# Design: NicheAI MLP PLG Refactor

## Context

The current "Reverse Demo Hook" is undermined by fragility in state management, streaming, and auth. Our streaming LLM calls are expensive, and dropped connections currently waste resources. We need to harden the perimeter, optimize API utilization via resumeable SSE, and fix critical UX bugs.

## Goals

- Secure endpoints against DoW, Event Loop Starvation, and IDOR.
- Prevent duplicate LLM API costs resulting from background worker / client dual-processing.
- Deliver sub-second token streaming (the "wow" factor) combined with resilient state saving.
- Ensure robust Auth upgrading from anonymous sessions.

## Non-Goals

- Building complex enterprise-grade distributed locks, "Suicide Pacts", or Decoupled Heartbeats. We will rely on standard retries, basic status flags, and structured Abort lifecycles.
- Fully supporting cross-device magic link continuation (downgrading this to a same-device limitation to prioritize OAuth).

## Decisions

1. **True Decoupled Execution (Claim-Check):**
   We will completely separate LLM execution from client observation. Phase 1 synchronously writes a `"pending"` job to Firestore, dispatches a Google Cloud Task, and returns a `202 Accepted`.
2. **Dedicated Cloud Run Worker & Redis Sub-Second Streaming:**
   The Cloud Task hits an internal worker endpoint. This worker idempotently claims the job via `runTransaction` (using a `leased_until` timestamp to allow dead-lock stealing if a worker OOMs). It executes the LLM, streams sub-second chunks to a fast-ephemeral layer (like Redis Pub/Sub), and flushes the aggregated text buffer to Firestore every 3-5 seconds for persistence.
3. **Reactive Observation Layer (SSE via Redis):**
   The client connects to a Phase 2 SSE endpoint that subscribes to the Redis Pub/Sub channel for sub-second streaming, while falling back to the Firestore document for the initial `fullText` (cursor). If the client disconnects, the SSE endpoint unsubscribes. The background worker _continues_ generating.
4. **OAuth over Magic Links & Orphan Prevention:**
   Aggressively steer users to standard OAuth (Google/GitHub) for upgrading anonymous accounts. We will use `linkWithCredential` and catch conflicts gracefully. Upon a successful `auth/credential-already-in-use` merge, a backend hook or explicit API call MUST reassign the `owner_uid` on all the user's previous `jobs` to their new permanent UID to prevent orphaned reports.
5. **Rate Limiting & Identifiers:**
   Use time-bucketed keys with strict Firestore Transactions. Rely on Firebase Anonymous Auth UIDs for primary business quota limits, but MUST reinstate Application-level hashed IP rate limiting (IPv6 bucketed to /64 and HMAC-SHA256 hashed with a pepper) as a secondary check to prevent slow-loris DoW attacks via UID resets.
6. **Collection Unification & Logical TTLs:**
   Standardize the claim-check state machine on a single `jobs` collection. Set an `expiresAt` native Timestamp, but since physical Firestore TTL sweepers take up to 72 hours, MUST strictly enforce logical expiration (`expiresAt < now()`) in frontend queries, backend routes, and Firestore Security Rules.
7. **Idempotent Dispatch & LLM Continuation:**
   The Cloud Task worker MUST claim the job using `runTransaction` (setting a `leased_until` timestamp) to prevent duplicate invocations from Cloud Tasks retries, while allowing another worker to steal the lock if a container crashes mid-inference. If multi-step generations are required, Gemini Chat History prefilling (passing partial text as `role: model`) MUST be used rather than naive string concatenation.
8. **PLG Conversion Hooks & Resilience:**
   - **Rate Limits:** Logical quota limits (402/`QUOTA_EXCEEDED`) trigger an auth/upgrade conversion modal. Physical WAF/contention throttles (429/503) just show a polite "System busy" toast.
   - **TTL Urgency:** Anonymous jobs must display a countdown banner based on `expiresAt` ("This report is temporary...").
   - **Resume Flow:** Since disconnects no longer abort the background generation, the user returns to a completed or still-processing report seamlessly. The concept of an explicitly `aborted_prematurely` job is removed entirely. Provide a "Email Me When Done" conversion hook to capture emails during long waits.

## Risks/Trade-offs

- **Cross-device magic links** will essentially degrade. Acceptable trade-off to steer toward OAuth and remove the fragile "Auth Session Ledger".
- **Stored XSS** risk from cached markdown generation. Mitigation: Frontend MUST aggressively sanitize the streaming markdown (e.g., DOMPurify) before rendering.
