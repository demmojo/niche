# RFC v23: True Out-of-Band Claim Check & Ledger-Backed Idempotency

**Status:** Proposed  
**Author:** NicheAI Architecture Team  
**Reviewers:** Engineering, Infrastructure, Security  
**Obsoletes:** RFC v22

## 1. Executive Summary

RFC v22 failed due to two critical workspace rule violations: allowing Node.js to synchronously buffer payloads >100KB (leading to V8 memory exhaustion / OOM crashes), and relying on naive Redis caching for idempotency which caused double-execution race conditions during Cloud Task network partitions.

RFC v23 solves these final roadblocks by enforcing the **True Out-of-Band Claim Check** pattern using Direct-to-GCS Pre-Signed URLs, and replacing Redis with a **Firestore State-Machine Ledger** to guarantee mathematically sound, exactly-once execution.

## 2. Architectural Fixes & Hardening

### 2.1. True Out-of-Band Uploads (Fixing Node.js Memory Exhaustion)

**The Problem:** Passing 50MB multiplexed telemetry payloads through Node.js Express middleware will exceed the 100KB memory cap, causing V8 OOM crashes and taking down the entire Cloud Run instance.
**The Fix:**
The ingestion pathway is bifurcated. Node.js never touches the data payload.

1. **Slot Reservation:** The client calls a lightweight `POST /api/telemetry/reserve` endpoint. The JSON payload is strictly capped at 100KB via `app.use(express.json({ limit: '100kb' }))`.
2. **Pre-Signed URL Generation:** The backend generates a GCP Pre-Signed PUT URL (valid for 15 minutes) restricted to `content-length-range: 0-100MB`.
3. **Direct Upload:** The client streams the massive payload _directly_ to Cloud Storage via the Pre-Signed URL. Node.js memory and concurrency are completely bypassed.

### 2.2. Firestore State-Machine Ledger (Fixing Double-Execution Races)

**The Problem:** Late caching of a 202 response in Redis allowed client retries to duplicate background executions if the initial Cloud Tasks enqueue timed out.
**The Fix:**
We enforce the workspace mandate for a Firestore state-machine ledger.

1. **Pre-Commit Reservation:** During the Slot Reservation (Step 2.1.1), Node.js uses `Firestore.runTransaction` to insert a ledger document:
   `doc('ingestions/{tenantId}_{X-Idempotency-Key}') -> { status: 'RESERVED', jobId: UUID, expiresAt: ... }`.
2. **Idempotency Guarantee:** If the client retries the reservation request with the same key, the transaction sees the existing document and returns the original Pre-Signed URL and `jobId`.
3. **Worker Deduplication:** When the GCS upload finishes, it triggers an Eventarc -> Pub/Sub -> Cloud Task worker. The worker _must_ run a transaction:
   `if (doc.status === 'RESERVED') { update({ status: 'PROCESSING' }) } else { return 'Already Processed' }`
   This perfectly resolves exactly-once execution semantics even if the GCP eventing fabric delivers the event multiple times.

### 2.3. Event-Driven Choreography (Fixing Node.js Enqueue Bottlenecks)

**The Problem:** Having Node.js manually enqueue Cloud Tasks after GCS writes caused orphan blobs when the enqueue failed.
**The Fix:**
Node.js no longer enqueues the processing task.
Instead, we rely on GCP's native eventing: **GCS `s3:ObjectCreated:Put` -> Eventarc -> Cloud Tasks/PubSub -> Worker**.
This guarantees that _every_ successful upload automatically triggers a worker, eliminating the enqueue-failure gap entirely. If a client abandons the upload, the GCS Object Lifecycle Management (OLM) TTL of 24 hours cleans up the empty reservation bucket.

## 3. Security Boundary Affirmation

- **Edge Auth:** API Gateway validates JWTs.
- **Zero-Trust Processing:** Workers still exchange global credentials for Downscoped STS Tokens restricted to `projects/_/buckets/ephemeral-ingest/objects/ingestions/{tenantId}/*`, preventing path-traversal SSRF.

## 4. Conclusion

RFC v23 represents the pinnacle of serverless ingestion architecture. By strictly obeying the 100KB Node.js memory limit, shifting heavy data transfer to GCP Edge infrastructure, and enforcing state-machine atomicity via Firestore, the protocol achieves theoretically perfect resilience against volumetric DoS, memory exhaustion, and distributed race conditions.
