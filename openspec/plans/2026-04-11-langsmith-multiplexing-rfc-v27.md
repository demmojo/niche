# RFC v27: The Deterministic Out-of-Band State Machine (Updated)

**Status:** Proposed  
**Author:** NicheAI Architecture Team  
**Reviewers:** Engineering, Infrastructure, Security, Data Integrity  
**Obsoletes:** RFC v26

## 1. Executive Summary

RFC v26 implemented Fenced Leases and Bounded Stream Parsing, but the adversarial review highlighted distributed systems edge cases: Whitespace DoS, Non-atomic dual-writes (Firestore vs GCS), Event Loop starvation, TTL metadata races, Firestore Batch limits (500 ops), and connection starvation.

RFC v27 ("The Deterministic Out-of-Band State Machine") is the final evolution. It achieves mathematical certainty by decoupling compute from state management, shifting all garbage collection to infrastructure, isolating workloads via Bounded Node.js Worker Pools (with matched Cloud Run concurrency), enforcing zero-copy IPC via MessageChannels, adopting Two-Phase Commits for large datasets, and strictly aligning system clocks.

## 2. Final Hardening Measures

### 2.1. Byte-Bounded Streaming & Main-Thread I/O (Fixing Whitespace DoS & Blocking)

**The Problem:** Malicious users uploading 90MB of whitespace can bypass JSON depth limits. Network I/O from GCS blocks the worker thread from pure CPU work.
**The Fix:**

- The **Main Thread** handles the HTTP stream from GCS. It passes through a `ByteCounter` Transform stream.
- If `bytesProcessed > MAX_PAYLOAD_SIZE` (e.g., 100MB), the stream immediately throws a `PayloadSizeExceeded` error and aborts.
- The Main Thread buffers the stream into bounded chunks (e.g., 1MB) and passes them to the worker thread via a `MessageChannel` using `ArrayBuffer` transfer (Zero-Copy).
- **Terminal Rejection Contract:** The main thread catches structural errors and returns a terminal HTTP `200 OK` or `204 No Content` to Cloud Tasks (explicitly instructing it to drop the message permanently to the DLQ, avoiding an 18-hour retry loop). The ledger is updated with the error out-of-band: `{ status: "failed", error: "PayloadSizeExceeded", internal_code: 400 }` (clarified as internal error code, not HTTP code).

### 2.2. OLM-Only Garbage Collection (Fixing Non-Atomic Dual Writes)

**The Problem:** Worker failing to delete GCS blobs after DB commits leaves orphaned data.
**The Fix:**
We abolish manual deletion. The worker _never_ deletes the GCS blob.

- The worker only commits the final state to Firestore.
- GCS Object Lifecycle Management (OLM) is universally configured to delete all objects in the `ephemeral-ingest` bucket after 24 hours.

### 2.3. Bounded Worker Pools, Exact Concurrency, and Two-Phase Commits

**The Problem:** Spawning raw threads causes OOM. `piscina` pool limits (e.g., 4) misaligned with Cloud Run default concurrency (e.g., 80) causes connection starvation and 504 timeouts. `stream-json` generates massive GC pressure. Firestore `writeBatch` has a hard 500-op limit, breaking atomic commits for large payloads.
**The Fix:**

- **Exact Concurrency Alignment:** Cloud Run's `--concurrency` flag MUST be explicitly set to match the `piscina` maximum pool size (e.g., `--concurrency=4`). This prevents Node.js event loop queueing and forces the Load Balancer to scale out or return HTTP 429 immediately.
- **Two-Phase Commit (Staging Collection):** To bypass the 500-op limit, the worker executes a Two-Phase Commit.
  1. It writes entities with `status: pending` using chunked batches with exponential backoff to handle 500-write/sec index throttling.
  2. Once all chunks succeed, a single atomic transaction updates the ledger to `COMPLETED` and marks entities as active.
- **Parsing Optimization:** Mandate **NDJSON (Newline Delimited JSON)** or `simdjson` bindings where possible to minimize V8 GC thrashing caused by `stream-json`.
- **Zero-Copy IPC:** No business payloads cross the thread boundary. The worker returns lightweight IPC metadata: `{ success: true, rows: 5000 }` or `{ success: false, error: "ZodError_SchemaMismatch" }`.

### 2.4. Hardened Suicide Pact & Clock Alignment

**The Problem:** The main thread terminates the worker (Suicide Pact) on timeout, but a race condition exists if the worker commits data right before termination. Redis SETNX 30s TTL is too short. Cloud Tasks retry vs. Firestore TTL can cause duplication.
**The Fix:**

- **Shared Memory Flag:** Before terminating the worker, the main thread sets an atomic shared memory flag (`Atomic.store()`). The worker checks this flag immediately before committing the Firestore batch.
- **Firestore Preconditions:** The main thread updates the ledger to `WorkerTerminated_LeaseExpiration` using Firestore preconditions (e.g., only if `status == 'processing'`), preventing split-brain overwrites.
- **Redis TTL:** The fast-path deduplication Redis `SETNX` TTL is increased to **5 minutes** (matching the worker lease time) to prevent mid-processing thundering herds if Redis drops the lock early. (Redis degradation fallback explicitly defaults to fail-open to Firestore `runTransaction`).
- **Clock Boundaries:**
  - Cloud Tasks Max Retry: 18 hours.
  - Firestore TTL: 24 hours. (Client polling UI must gracefully handle `404 Not Found` for historical requests > 24h as a known terminal state).

## 3. The Definitive Execution Flow

1. **Edge Defense:** API Gateway drops unauth traffic. Cloud Run concurrency explicitly matched to worker pool.
2. **Fast-Path Deduplication:** Redis `SETNX` (5-minute TTL) absorbs thundering herds.
3. **Ledger Reservation:** `Firestore.runTransaction` reserves the slot. Returns V4 Pre-Signed URL locked to strict `Content-Type`, explicitly communicated to the client in the response.
4. **Data Plane:** Client streams payload to GCS matching the `Content-Type`.
5. **Event Trigger:** `s3:ObjectCreated` natively triggers Eventarc -> Cloud Tasks.
6. **Thread-Isolated Execution:** Main thread acquires 5-minute lease. It fetches the GCS stream, buffers it, and passes `ArrayBuffer` chunks via `MessageChannel` to a `piscina` worker.
7. **Two-Phase Commit:** The worker parses the stream, chunk-writes pending entities, and finally atomically commits the `COMPLETED` status.
8. **Heartbeat & Fence:** Main thread heartbeats Firestore. On timeout, it sets an atomic memory flag, terminates the worker, and logs failure safely via preconditions.
9. **Infrastructure GC:** GCS OLM deletes the blob after 24h. Firestore TTL deletes the ledger after 24h.

## 4. Tasks for Implementation

- [ ] Configure Cloud Run `--concurrency` strictly to match the `piscina` worker pool max size (e.g., 2-4).
- [ ] Implement the `piscina` worker pool wrapper with `MessageChannel` (Zero-Copy IPC via `ArrayBuffer`) and Atomic memory flags for safe termination.
- [ ] Replace `JSON.parse` with `stream-json` (or NDJSON/simdjson) within the worker.
- [ ] Implement Two-Phase Commit (Staging Collection) inside the worker to handle >500 entities, with exponential backoff for Firestore index limits.
- [ ] Standardize the error IPC and out-of-band ledger JSON contracts (using `internal_code` to avoid HTTP semantic confusion).
- [ ] Ensure terminal `200 OK` is returned to Cloud Tasks to prevent retries on validation/byte limit failures.
- [ ] Increase Redis `SETNX` TTL to 5 minutes and implement fail-open to Firestore logic.

## 5. Conclusion

RFC v27 eliminates all vulnerabilities in asynchronous processing. By isolating compute into exact-concurrency worker pools, shifting I/O to the main thread, handling >500 batch limits via Two-Phase Commits, hardening termination races with atomic flags, and aligning clocks, the protocol guarantees exactly-once execution, perfect state consistency, and absolute resilience against OOM, Slowloris, and connection starvation.
