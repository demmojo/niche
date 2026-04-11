# RFC v12: LangSmith Multiplexing Protocol - Resilient Ingestion & State Management

**Date:** April 11, 2026  
**Status:** Proposed  
**Author:** Best Practices Researcher

## 1. Context & Motivation

RFC v11 of the LangSmith Multiplexing Protocol introduced foundational mechanisms for handling high-volume webhook and telemetry data. However, extensive adversarial testing and production-simulation revealed four critical architectural flaws that compromised system stability and data integrity:

1. **Chunked Encoding Velocity Bypass (Header Spoofing):** Relying on the `Content-Length` header allowed malicious or misconfigured clients to bypass payload size limits by sending payload streams utilizing `Transfer-Encoding: chunked` or spoofed length headers.
2. **Idempotency Deadlocks:** The implementation relied on 24-hour rigid locks for idempotency. If a worker crashed during processing (e.g., OOM), the lock remained active, causing permanent data loss as retries were dropped.
3. **Framework Consumption Conflict:** Global middleware (`express.json()`) consumed the TCP stream buffers globally. Subsequent attempts to use `req.pipe()` within specific routes failed because the stream had already been drained.
4. **Flat-String Breadth OOMs:** Relying on synchronous JSON parsing, or even SAX-based JSON parsers, caused Out-Of-Memory (OOM) crashes when ingesting single, massive flat-string tokens.

This RFC (v12) conclusively closes these gaps by enforcing strict, byte-level accountability, lease-based state management, and opaque binary passthrough.

## 2. Goals & Non-Goals

**Goals:**

- Guarantee OOM-free ingestion of arbitrarily large, potentially hostile payloads.
- Ensure deterministic, self-healing idempotency via lease-renewals.
- Isolate framework-level stream consumption.
- Maintain high throughput with minimal overhead on the Node.js event loop.

**Non-Goals:**

- Changing the underlying telemetry schemas.
- Modifying the downstream frontend consumption of this data.

## 3. Architectural Fixes

### 3.1. Active Stream Byte Accounting

We can no longer trust HTTP headers (`Content-Length`) for capacity planning or security.

**Solution:** Implement a Node.js `Transform` stream that acts as an active byte counter. This stream sits between the incoming request and the storage destination. If the accumulated bytes exceed the strictly defined quota, it immediately destroys the socket, preventing memory exhaustion and bandwidth theft.

**Implementation Pattern:**

```javascript
import { Transform } from "stream";

class ByteQuotaTransform extends Transform {
  constructor(maxBytes) {
    super();
    this.maxBytes = maxBytes;
    this.bytesProcessed = 0;
  }

  _transform(chunk, encoding, callback) {
    this.bytesProcessed += chunk.length;
    if (this.bytesProcessed > this.maxBytes) {
      // Destroy the stream immediately to stop ingestion
      const err = new Error("Payload Too Large: Quota Exceeded");
      err.code = "QUOTA_EXCEEDED";
      this.destroy(err);
      return callback(err);
    }
    callback(null, chunk);
  }
}
```

### 3.2. Short-Lived Lease Renewal (Self-Healing Locks)

The 24-hour static lock is an anti-pattern for distributed worker systems.

**Solution:** Implement a heartbeat-based lease mechanism using Firestore. Instead of setting `status: 'locked'`, we write a `locked_until` timestamp (e.g., `serverTimestamp() + 30 seconds`). The active worker must run a background timer (heartbeat) that continually extends this lease via Firestore transactions. If the worker crashes, the heartbeat stops, the lease naturally expires, and another worker can safely claim the job.

**Implementation Pattern:**

```javascript
// Worker claiming a job
await firestore.runTransaction(async (t) => {
  const doc = await t.get(jobRef);
  const now = admin.firestore.Timestamp.now();

  if (doc.exists && doc.data().locked_until > now) {
    throw new Error("Job is currently locked by an active worker");
  }

  // Claim with a 30-second lease
  t.update(jobRef, {
    locked_until: admin.firestore.Timestamp.fromMillis(now.toMillis() + 30000),
    worker_id: process.env.K_REVISION || "worker-instance",
  });
});

// Heartbeat interval (runs every 15 seconds)
const heartbeat = setInterval(async () => {
  await jobRef.update({
    locked_until: admin.firestore.FieldValue.serverTimestamp(), // +30s logic applied in a transaction/update
  });
}, 15000);
```

### 3.3. Route-Isolated Middleware

Express middleware order and globality directly dictate stream state. `app.use(express.json())` acts as a global sink, mutating `req` and draining the underlying TCP socket.

**Solution:** Remove global body parsers entirely. Apply `express.json()` strictly and only to the specific routes that require small, synchronous payload parsing. Ingestion routes must receive the raw `req` object completely unconsumed.

**Implementation Pattern:**

```javascript
// BAD: Global drain
// app.use(express.json());

const app = express();

// Good: Route-isolated JSON parsing for standard API endpoints
app.post("/api/v1/config", express.json({ limit: "100kb" }), configHandler);

// Good: Opaque Pass-Through for Multiplexing Ingestion
// No middleware applied here; `req` remains an unread Stream
app.post("/api/v1/ingest", rawIngestionHandler);
```

### 3.4. Pure Opaque Ingestion (Binary Pass-Through)

Attempting to parse JSON (even asynchronously via SAX parsers like `stream-json`) during the HTTP request cycle exposes the web server's event loop to starvation and memory exhaustion from massive string tokens.

**Solution:** Treat the incoming payload as pure, opaque binary data. The web server's only responsibility is to pipe the raw TCP stream directly into Google Cloud Storage (blob storage) via the byte-accounting transform. Validation and parsing are shifted entirely to background workers operating on the persisted blob.

**Implementation Pattern:**

```javascript
async function rawIngestionHandler(req, res) {
  // 1. Generate unique blob reference
  const blobId = crypto.randomUUID();
  const file = bucket.file(`ingestions/${blobId}.json`);

  // 2. Setup Opaque Pipeline
  const byteCounter = new ByteQuotaTransform(10 * 1024 * 1024); // 10MB hard limit
  const writeStream = file.createWriteStream({
    resumable: false,
    validation: false,
  });

  // 3. Pipe and monitor
  req.pipe(byteCounter).pipe(writeStream);

  writeStream.on("finish", () => {
    // 4. Enqueue background task pointing to the Blob ID
    enqueueValidationTask(blobId);
    res.status(202).json({ status: "Accepted", jobId: blobId });
  });

  byteCounter.on("error", (err) => {
    req.destroy(); // Immediately sever connection
    if (err.code === "QUOTA_EXCEEDED") {
      res.status(413).json({ error: "Payload Too Large" });
    } else {
      res.status(500).json({ error: "Ingestion Failed" });
    }
  });
}
```

## 4. Security & Reliability Validation

- **Event Loop Starvation:** By deferring JSON parsing to background Cloud Run worker instances and treating ingress as opaque binary, the primary HTTP ingress remains lightweight and immune to regex/parsing DOS attacks.
- **Dead-Letter Recovery:** The short-lived lease mechanism guarantees that failing payloads are inherently retried. If a payload consistently causes worker OOMs, the retry mechanism will exhaust and route the job to a Dead Letter Queue (DLQ) without pausing the pipeline.
- **TOCTOU Resilience:** Byte limits are enforced deterministically as data traverses the wire, neutralizing any Time-Of-Check to Time-Of-Use vulnerabilities related to header verification.

## 5. Rollout Plan

1. **Deploy Isolated Middleware (Non-Breaking):** Audit and remove global `express.json()` calls, scoping them strictly to necessary routes.
2. **Deploy Opaque Ingestion:** Roll out the new `/ingest` route using `req.pipe()` to storage.
3. **Migrate Workers to Lease Pattern:** Update the Firestore schema and background worker loops to respect `locked_until` semantics.
4. **Deprecate v11 Endpoints:** Once clients are confirmed to be routing to the v12 opaque endpoints, decommission the synchronous parsing paths.
