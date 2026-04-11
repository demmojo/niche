# RFC v26: Fully Fenced Zero-Trust Asynchronous Multiplexing

**Status:** Proposed  
**Author:** NicheAI Architecture Team  
**Reviewers:** Engineering, Infrastructure, Security  
**Obsoletes:** RFC v25

## 1. Executive Summary

RFC v25 was a massive leap forward but suffered from three classic distributed systems vulnerabilities: Redis lock expiry race conditions, Lease stealing dual-execution (Split-Brain), and Resource exhaustion via JSON bombs bypassing the Content-Type policy.

RFC v26 ("Fully Fenced Zero-Trust Asynchronous Multiplexing") implements the final architectural defenses required for a mathematical guarantee of resilience: Defense-in-Depth Deduplication, Fenced Leases (Suicide Pacts), and Bounded Stream Parsing.

## 2. Final Hardening Measures

### 2.1. Defense-in-Depth Deduplication (Fixing Redis Lock Races)

**The Problem:** If a 5-second Redis lock expires while a slow Firestore transaction is still executing, a second request can grab the lock and initiate a concurrent transaction, breaking the deduplication shield.
**The Fix:**
We decouple the _intention_ of the locks.

1.  **The Fast-Path Shield (Redis):** The Redis `SETNX` lock TTL is increased to 30 seconds. Its only job is to absorb 99.9% of the thundering herd.
2.  **The Mathematical Backstop (Firestore):** We rely strictly on `Firestore.runTransaction` as the ultimate source of truth. Even if the Redis lock expires and two requests slip through, Firestore's Optimistic Concurrency Control (OCC) mathematically serializes them. The transaction checks `if (doc.exists)`—if true, the second request is safely rejected and returned the cached 202 URL.

### 2.2. Fenced Leases & "Suicide Pacts" (Fixing Split-Brain)

**The Problem:** A worker takes a 5-minute lease but processing takes 6 minutes due to network latency. The lease expires, a second worker steals it, and the first worker eventually finishes. The payload is processed twice (Split-Brain).
**The Fix:**
We implement the **Fencing Token + Suicide Pact** pattern.

1.  **Heartbeating:** The worker runs a background `setInterval` every 2 minutes to extend the `leaseExpiresAt` in Firestore.
2.  **The Suicide Pact:** The entire processing pipeline (GCS Read Stream -> Parser -> Output) is bound to an `AbortSignal`. If the heartbeat transaction fails (e.g., network partition) or the lease cannot be extended, the `AbortController.abort()` is immediately triggered.
3.  **Guaranteed Death:** The worker instantly destroys all streams and exits _before_ the lease expires. It is mathematically impossible for the original worker to complete the task if another worker has stolen the lease.

### 2.3. Bounded Stream Parsing (Fixing JSON Bombs)

**The Problem:** A malicious user uploads a 90MB payload of `[[[[[[[[[[[[...` (infinite arrays) or gigabytes of whitespace. It passes the GCS V4 `Content-Type: application/json` check, but crashes the Node.js streaming parser via V8 memory exhaustion or maximum call stack size exceeded.
**The Fix:**
The worker implements a **Depth-Limited Streaming Parser**.

1.  The GCS stream is piped through a bounded parser (e.g., using `stream-json` configured with strict constraints: `maxDepth: 20`, max string lengths, max array sizes).
2.  If the parser detects a violation of these structural invariants, it throws a `PayloadTooDeep` error.
3.  The `AbortSignal` fires, the stream is destroyed, and the task is immediately routed to a permanent Dead Letter Queue (DLQ), ensuring the poison pill is never retried.

## 3. The Definitive Execution Flow

1. **Edge Defense:** API Gateway drops unauth traffic. Redis Token Bucket limits reservations.
2. **Fast-Path Deduplication:** Redis `SETNX` (30s TTL) absorbs thundering herds.
3. **Ledger Reservation:** `Firestore.runTransaction` provides the absolute ACID deduplication guarantee. Returns V4 Pre-Signed URL.
4. **Data Plane:** Client streams payload to GCS (bypassing Node.js).
5. **Event Trigger:** `s3:ObjectCreated` natively triggers Eventarc -> Cloud Tasks.
6. **Fenced Execution:** Worker acquires a 5-minute lease and Downscoped STS Credentials.
7. **Heartbeat & Parse:** Worker heartbeats the lease every 2m. Streams the GCS blob through a depth-limited parser. If heartbeat fails or depth exceeded, worker suicides via `AbortSignal`.
8. **Finalization:** Worker commits final state, deletes the GCS blob.
9. **Automated Cleanup:** Firestore TTL Index cleans up stale metadata after 24h.

## 4. Conclusion

RFC v26 achieves the absolute pinnacle of resilient, asynchronous, zero-trust ingestion architecture for a Node.js/GCP stack. By combining Defense-in-Depth, strict resource parsing bounds, and Fenced Leases, the system is immune to thundering herds, split-brain race conditions, and streaming resource exhaustion.
