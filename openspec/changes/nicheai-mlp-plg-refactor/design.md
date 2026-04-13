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
   We will completely separate LLM execution from client observation. Phase 1 synchronously writes a `"pending"` job to Firestore, dispatches a deterministic Google Cloud Task (`tasks/{jobId}`), and returns a `202 Accepted`.
2. **Dedicated Cloud Run Worker & Redis Sub-Second Streaming:**
   The Cloud Task hits an internal worker endpoint. This worker idempotently claims the job via `runTransaction`. It executes the LLM, streams sub-second chunks to a fast-ephemeral layer (Redis Pub/Sub), and flushes the aggregated text buffer to Firestore every 3-5 seconds for persistence.
3. **Reactive Observation Layer (SSE via Redis Singleton Multiplexer):**
   The client connects to a Phase 2 SSE endpoint that utilizes a Redis Singleton Multiplexed Subscriber. Instead of creating a new Redis connection per SSE client, a singleton Redis subscriber listens to all active channels and uses Node's `EventEmitter` to fan out chunks to the correct SSE response streams. This prevents socket exhaustion under load.
4. **OAuth over Magic Links & Graceful Orphan Handling:**
   Aggressively steer users to standard OAuth (Google/GitHub) for upgrading anonymous accounts. We will use `linkWithPopup` which seamlessly upgrades the anonymous UID to a permanent account. If `auth/credential-already-in-use` occurs, we extract the OAuth credential and use `signInWithCredential`. We explicitly reject complex IDOR-prone bulk UID reassignment APIs; any jobs from the conflicting anonymous session will be gracefully orphaned as an acceptable PLG trade-off.
5. **Rate Limiting & Identifiers:**
   Pivot rate limiting entirely to Redis using atomic `INCR` and `EXPIRE` commands for sub-millisecond, low-latency quota enforcement. We explicitly abandon Firestore sharded counters, which suffer from massive transaction contention (`DEADLINE_EXCEEDED`) and query-lock inefficiencies under load. Rely on Firebase Anonymous Auth UIDs for primary business quota limits, but MUST reinstate Application-level hashed IP rate limiting (IPv6 bucketed to /64 and HMAC-SHA256 hashed with a pepper) as a secondary check to prevent slow-loris DoW attacks via UID resets.
6. **Collection Unification & Logical TTLs:**
   Standardize the claim-check state machine on a single `jobs` collection. Set an `expiresAt` native Timestamp, but since physical Firestore TTL sweepers take up to 72 hours, MUST strictly enforce logical expiration (`expiresAt < now()`) in frontend queries, backend routes, and Firestore Security Rules.
7. **Idempotent Dispatch & LLM Continuation:**
   By naming the Cloud Task deterministically (`tasks/{jobId}`), we guarantee GCP-level infrastructure idempotency, preventing duplicate worker invocations. If multi-step generations are required, Gemini Chat History prefilling (passing partial text as `role: model`) MUST be used rather than naive string concatenation.
8. **PLG Conversion Hooks & Resilience:**
   - **Rate Limits:** Logical quota limits (402/`QUOTA_EXCEEDED` or `Payment Required`) trigger an auth/upgrade conversion modal. Physical WAF/contention throttles (429/503) just show a polite "System busy" toast.
   - **TTL Urgency:** Anonymous jobs must display a countdown banner based on `expiresAt` ("This report is temporary...").
   - **Resume Flow:** Since disconnects no longer abort the background generation, the user returns to a completed or still-processing report seamlessly. The concept of an explicitly `aborted_prematurely` job is removed entirely. We explicitly reject "Email Me When Done" fallbacks; instead, the architecture relies on in-UI graceful degradation and Two-Phase Fetch status polling.
   - **Mid-Stream Cancellation:** Workers will listen to a fast-ephemeral layer (Redis) on a job-specific channel (`cancel:{jobId}`) for a `cancel` event to safely abort inference.
   - **Smooth DOM Updates:** Use React 19 `useDeferredValue` for processing the streamed markdown to keep the main thread unblocked.

## Risks/Trade-offs

- **Cross-device magic links** will essentially degrade. Acceptable trade-off to steer toward OAuth and remove the fragile "Auth Session Ledger".
- **Stored XSS** risk from cached markdown generation. Mitigation: Frontend MUST aggressively sanitize the streaming markdown (e.g., DOMPurify) combined with React 19 `useDeferredValue` before rendering.
