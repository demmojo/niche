# RFC v25: Production-Ready Asynchronous Multiplexing

**Status:** Proposed  
**Author:** NicheAI Architecture Team  
**Reviewers:** Engineering, Infrastructure, Security  
**Obsoletes:** RFC v24

## 1. Executive Summary

RFC v24 successfully implemented True Out-of-Band uploads, Edge Rate Limiting, and TTL-Indexed Garbage Collection. However, residual risk analysis highlighted three final edge cases:

1. **Firestore Contention:** Concurrent identical requests cause optimistic concurrency aborts, spiking CPU.
2. **Malware Hosting (MIME Hijacking):** Pre-Signed URLs restricted size but not content type, allowing attackers to host malicious binaries.
3. **Zombie Workers:** If a Cloud Run worker crashes mid-stream while the ledger is in `PROCESSING`, the payload becomes permanently deadlocked.

RFC v25 ("Production-Ready Asynchronous Multiplexing") is the definitive, production-hardened protocol. It introduces Fast-Path Deduplication, V4 Policy Content-Type Enforcements, and Lease-Based State Recovery.

## 2. Final Hardening Measures

### 2.1. Fast-Path Deduplication (Shielding Firestore)

**The Problem:** If a poorly written client script concurrently fires 100 requests with the same `X-Idempotency-Key`, Firestore's optimistic concurrency control will attempt to resolve them, causing up to 99 transaction aborts and retries. This burns Cloud Run CPU and spikes latency.
**The Fix:**
Before the `Firestore.runTransaction` begins, Node.js executes a lightweight, fast-path lock: `Redis SET idempotency_lock:{tenantId}:{key} "locked" NX EX 5`.

- Only the first request acquires the lock and proceeds to Firestore.
- The other 99 requests hit a fast-path rejection or sleep/retry loop against Redis, completely shielding Firestore from the thundering herd.

### 2.2. V4 Signed URL Policy Constraints (Preventing Malware Distribution)

**The Problem:** An attacker with a valid JWT could reserve a slot and upload a 90MB `.exe` or malware payload, turning the ephemeral bucket into a temporary malware CDN.
**The Fix:**
When generating the V4 Pre-Signed POST URL, the backend enforces a strict `Content-Type` condition.

- Policy constraint: `["eq", "$Content-Type", "application/json"]` (or custom multiplexed binary mime type).
- If the client attempts to upload an executable or image, Google Cloud Storage natively rejects the upload with a `403 Forbidden` before it writes a single byte.

### 2.3. Lease-Based Processing State (Zombie Worker Recovery)

**The Problem:** If a worker crashes out of memory _after_ marking the Firestore document as `PROCESSING`, the document stays in `PROCESSING` forever. The GCS blob is never deleted (until the 24h OLM), and the payload is never actually processed.
**The Fix:**
The `PROCESSING` state is upgraded to a **Lease**.

- Worker updates the doc to: `{ status: 'PROCESSING', leaseExpiresAt: Date.now() + 5_minutes }`.
- If the task fails and retries via Cloud Tasks, the new worker checks the state. If `status === 'PROCESSING'` but `Date.now() > leaseExpiresAt`, the new worker assumes the previous worker died, steals the lease, and safely re-processes the payload.

## 3. The Definitive Execution Flow

1. **Edge Defense:** API Gateway drops unauthenticated traffic. Redis Token Bucket enforces tenant quotas.
2. **Fast-Path Deduplication:** Redis `SETNX` shields Firestore from concurrent idempotency floods.
3. **Ledger Reservation:** `Firestore.runTransaction` reserves the slot. Returns a V4 Pre-Signed URL locked to strict `Content-Type` and `Content-Length`.
4. **Data Plane:** Client streams directly to GCS. Node.js concurrency remains free.
5. **Event Trigger:** `s3:ObjectCreated` natively triggers Eventarc -> Cloud Tasks.
6. **Zero-Trust Execution:** Worker acquires Downscoped STS Token.
7. **Leased Processing:** Worker uses `Firestore.runTransaction` to acquire a 5-minute processing lease. Streams and processes the blob.
8. **Finalization:** Worker marks document `COMPLETED` and natively deletes the GCS blob.
9. **Automated Cleanup:** Firestore TTL Index automatically deletes `RESERVED` or `COMPLETED` docs after 24 hours.

## 4. Conclusion

RFC v25 addresses the physical limits of database contention, edge-case distributed failures (zombie workers), and strict content security. By combining Edge Auth, Out-of-Band Data Planes, and Ledger-Backed Idempotency, this protocol achieves a 100% resilient, zero-trust architecture suitable for hyper-scale telemetry ingestion in LangSmith.
