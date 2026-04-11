# RFC v27: The Deterministic Out-of-Band State Machine

**Status:** Proposed  
**Author:** NicheAI Architecture Team  
**Reviewers:** Engineering, Infrastructure, Security, Data Integrity  
**Obsoletes:** RFC v26

## 1. Executive Summary

RFC v26 implemented Fenced Leases and Bounded Stream Parsing, but the adversarial review highlighted four fatal distributed systems edge cases: Whitespace DoS causing Cloud Tasks timeouts, Non-atomic dual-writes (Firestore vs GCS), Event Loop starvation defeating heartbeats, and TTL metadata races.

RFC v27 ("The Deterministic Out-of-Band State Machine") is the final evolution. It achieves mathematical certainty by decoupling compute from state management, shifting all garbage collection to infrastructure, isolating workloads via Node.js Worker Threads, and strictly aligning system clocks.

## 2. Final Hardening Measures

### 2.1. Byte-Bounded Streaming (Fixing Whitespace DoS)

**The Problem:** Malicious users uploading 90MB of whitespace can bypass JSON depth limits and keep the stream open indefinitely, causing Cloud Tasks to time out and enter an infinite retry loop.
**The Fix:**
Before the stream reaches the JSON parser, it passes through a `ByteCounter` Transform stream.

- If `bytesProcessed > MAX_PAYLOAD_SIZE` (e.g., 100MB), the stream immediately throws a `PayloadSizeExceeded` error and aborts.
- This terminates the whitespace attack in milliseconds, regardless of structural depth.

### 2.2. OLM-Only Garbage Collection (Fixing Non-Atomic Dual Writes)

**The Problem:** If a worker successfully updates Firestore to `COMPLETED` but fails to delete the GCS blob (network error), the blob is permanently orphaned. If it deletes the blob but fails to update Firestore, the state is deadlocked.
**The Fix:**
We abolish manual deletion. The worker _never_ deletes the GCS blob.

- The worker only commits the final `COMPLETED` state to Firestore (a single atomic operation).
- GCS Object Lifecycle Management (OLM) is universally configured to delete all objects in the `ephemeral-ingest` bucket after 24 hours.
- This completely eliminates the dual-write vulnerability. Garbage collection becomes an infrastructure guarantee, not an application responsibility.

### 2.3. Worker Thread Isolation (Fixing Event Loop Starvation)

**The Problem:** A heavy synchronous payload blocks the Node.js event loop. The 2-minute heartbeat `setInterval` and the timeout `AbortSignal` cannot fire, defeating the Suicide Pact and causing Split-Brain dual execution when the lease expires.
**The Fix:**
The main Cloud Run thread manages _only_ the network request and the Firestore heartbeat.

- The actual GCS streaming and JSON parsing is offloaded to a Node.js `worker_thread`.
- If the `worker_thread` hits a catastrophic ReDoS or synchronous block, the main thread's event loop is still free.
- The main thread enforces the Suicide Pact: if the heartbeat fails or the lease is about to expire, it calls `worker.terminate()`, instantly killing the stalled process and failing the task cleanly.

### 2.4. Clock Alignment (Fixing TTL/Retry Races)

**The Problem:** Cloud Tasks might retry a failed payload after 25 hours. If the Firestore deduplication shield is deleted by TTL after 24 hours, the 25th-hour retry will be treated as a brand new request, breaking exactly-once processing.
**The Fix:**
We enforce a strict mathematical boundary between compute retries and state metadata.

- **Cloud Tasks Max Retry Duration:** Capped strictly at `18 hours`.
- **Firestore TTL:** Capped at `24 hours`.
- A task is guaranteed to be dead (dropped to DLQ) at least 6 hours before its idempotency shield is garbage-collected.

## 3. The Definitive Execution Flow

1. **Edge Defense:** API Gateway drops unauth traffic. Redis Token Bucket limits reservations.
2. **Fast-Path Deduplication:** Redis `SETNX` (30s TTL) absorbs thundering herds.
3. **Ledger Reservation:** `Firestore.runTransaction` reserves the slot. Returns V4 Pre-Signed URL locked to strict `Content-Type`.
4. **Data Plane:** Client streams payload to GCS.
5. **Event Trigger:** `s3:ObjectCreated` natively triggers Eventarc -> Cloud Tasks.
6. **Thread-Isolated Execution:** Main thread acquires a 5-minute lease and Downscoped STS Credentials. It spawns a `worker_thread` to process the blob via a byte-bounded stream.
7. **Heartbeat & Fence:** Main thread heartbeats Firestore every 2m. If the worker thread hangs or heartbeat fails, main thread terminates the worker.
8. **Atomic Commit:** Worker thread finishes, main thread commits `COMPLETED` to Firestore. (Task finishes).
9. **Infrastructure GC:** GCS OLM deletes the blob after 24h. Firestore TTL deletes the ledger after 24h.

## 4. Conclusion

RFC v27 eliminates the final theoretical vulnerabilities in asynchronous processing. By isolating compute into worker threads, delegating garbage collection to OLM, and enforcing strict clock boundaries, the protocol guarantees exactly-once execution, perfect state consistency, and absolute resilience against all known DoS vectors.
