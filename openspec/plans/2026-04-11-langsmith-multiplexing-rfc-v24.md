# RFC v24: Fully Hardened Out-of-Band Multiplexing

**Status:** Proposed  
**Author:** NicheAI Architecture Team  
**Reviewers:** Engineering, Infrastructure, Security  
**Obsoletes:** RFC v23

## 1. Executive Summary

RFC v23 introduced the True Out-of-Band Claim Check (Direct-to-GCS) and Firestore State-Machine Ledger to solve Node.js OOMs and double-execution races. However, adversarial review revealed edge cases: Financial DoS via abandoned reservations, state deadlocks on expired URLs, and path traversal vulnerabilities.

RFC v24 is the final, hardened iteration. It introduces Edge Rate Limiting, TTL Indexes for automated Firestore cleanup, expiration-aware idempotency, and strict cryptographic sanitization.

## 2. Architectural Hardening (The Final Fixes)

### 2.1. Strict Sanitization & Path Traversal Prevention

**The Problem:** If a client passes `../tenantB/malicious` as their `X-Idempotency-Key`, and the server uses it to construct the GCS path, the attacker can write to another tenant's namespace.
**The Fix:**
The Node.js ingress strictly validates the `X-Idempotency-Key` against a UUIDv4 or URL-safe Base62 regex (`^[a-zA-Z0-9_-]{10,64}$`). Any deviation results in an immediate `400 Bad Request`. The GCS object key is generated securely on the server (e.g., `crypto.randomUUID()`) and stored in the ledger, entirely decoupling the client's idempotency key from the physical storage path.

### 2.2. Edge Rate Limiting (Preventing Financial DoS)

**The Problem:** Malicious clients can spam `/api/telemetry/reserve`, burning Firestore writes ($0.18/100K) without ever uploading to GCS.
**The Fix:**
Before the `Firestore.runTransaction` executes, the request must pass a Redis Token Bucket rate limiter (e.g., max 100 reservations per minute per `tenantId`). This caps the maximum financial exposure of abandoned reservations to fractions of a cent per attacker.

### 2.3. Expiration-Aware Idempotency (Preventing Deadlocks)

**The Problem:** If a client reserves a slot but loses connection for 16 minutes, retrying with the same idempotency key in RFC v23 would return the original, now-expired Pre-Signed URL (yielding a 403 Forbidden from GCS).
**The Fix:**
The Firestore transaction now checks the document's `expiresAt` timestamp.

```javascript
if (doc.status === "RESERVED") {
  if (Date.now() > doc.expiresAt) {
    // Mint a new Pre-Signed URL and update expiresAt
    transaction.update({ expiresAt: newExpiry, uploadUrl: newUrl });
    return newUrl;
  }
  return doc.uploadUrl; // Return cached valid URL
}
```

### 2.4. TTL-Indexed Garbage Collection

**The Problem:** GCS Object Lifecycle Management (OLM) cleans up abandoned blobs, but it doesn't clean up the orphaned Firestore `RESERVED` documents if no upload ever occurs.
**The Fix:**
The Firestore collection `ingestions` is configured with a native **TTL (Time-To-Live) Index** on the `expiresAt` field. If an upload never completes (and thus the status is never moved to `COMPLETED`), Google automatically deletes the document 24 hours after expiration, ensuring the database size remains strictly bounded at zero maintenance cost.

## 3. The Complete Flow

1. **Auth & Limits:** API Gateway validates JWT. Redis Token Bucket enforces tenant limits. `X-Idempotency-Key` is regex-sanitized.
2. **Reservation:** Node.js executes `Firestore.runTransaction`. Mints a server-side UUID for the GCS blob. Returns a 15-minute Pre-Signed URL.
3. **Upload:** Client streams directly to GCS, completely bypassing Node.js memory limits (100KB Express limit enforced).
4. **Trigger:** GCS emits `s3:ObjectCreated` to Eventarc, which pushes to Cloud Tasks.
5. **Processing:** Worker executes transaction. If `RESERVED`, marks as `PROCESSING`. Worker processes stream, then marks `COMPLETED`.
6. **Cleanup:** Firestore TTL Index automatically deletes any stale documents.

## 4. Conclusion

RFC v24 achieves the theoretical maximum for ingestion resilience. It operates securely in zero-trust environments, requires no manual cleanup, mathematically caps financial and memory exposure, and elegantly handles edge-case state deadlocks.
