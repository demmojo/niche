# RFC v21: Zero-Trust Asynchronous Multiplexing

**Status:** Proposed  
**Author:** NicheAI Architecture Team  
**Reviewers:** Engineering, Infrastructure, Security  
**Obsoletes:** RFC v20

## 1. Executive Summary

RFC v20 of the LangSmith Multiplexing Protocol suffered from catastrophic anti-patterns: impossible WAF configurations, Connection Hoarding (exhausting Cloud Run concurrency), and Synchronous Payload Hashing (Event Loop starvation).

RFC v21 introduces the final, mathematically sound architecture: **Zero-Trust Asynchronous Multiplexing**. It strips all heavy computation, stateful holding, and custom cryptography out of the Node.js layer. Instead, it relies strictly on managed infrastructure (GCP API Gateway), Asynchronous Claim Checks, Client-Generated Idempotency, and Downscoped STS credentials.

## 2. Architectural Fixes

### 2.1. Edge-First Auth & Out-of-Band Fail2Ban (Replacing Impossible WAF Rules)

**The Problem:** v20 attempted to use Cloud Armor to dynamically ban IPs based on egress 401 responses, which is technically impossible.
**The Fix:**

1. **API Gateway JWT Validation:** We deploy GCP API Gateway (or Firebase Hosting + Cloud Run with IAP) in front of the Node.js backend. The gateway natively verifies the structural integrity and RSA signatures of the JWTs. Unauthenticated requests are dropped at the edge, costing 0 Node.js CPU cycles.
2. **Out-of-Band WAF Sync:** The API Gateway emits standard GCP metrics. We set up a Cloud Monitoring Sink -> Pub/Sub -> Cloud Function pipeline to aggregate repeated 401s and asynchronously update a Cloud Armor IP Blocklist.

### 2.2. Asynchronous 202 Accepted + Claim Check (Replacing Connection Hoarding)

**The Problem:** Holding HTTP connections open while waiting for background IAM fetches caused Cloud Run instances to instantly hit their 1,000 max connection limit.
**The Fix:**
We enforce a strict **Asynchronous Claim Check** pattern:

1. **Ingest & Acknowledge:** The Node.js server receives the payload and immediately writes it to an ephemeral Cloud Storage bucket (`ingestions/tenants/{tenantId}/{uuid}.json`).
2. **Enqueue:** The server dispatches a task to Cloud Tasks containing `{ tenantId, blobUri, idempotencyKey }`.
3. **202 Accepted:** The server immediately closes the HTTP connection, returning `202 Accepted` and the `jobId` to the client. Node.js concurrency is freed instantly.

### 2.3. Client-Generated Idempotency Keys (Replacing Synchronous Hashing)

**The Problem:** Running `fast-json-stable-stringify` and SHA-256 on a 5MB JSON payload blocks the Node.js Event Loop, creating a massive self-inflicted DoS.
**The Fix:**
The server will **never** hash payloads for idempotency.

1. Clients MUST provide an `X-Idempotency-Key` HTTP header (UUIDv4).
2. The API Gateway/Node.js server uses this key for an O(1) Redis/Firestore lookup.
3. If the client retries a request with a mutated payload, they must generate a new `X-Idempotency-Key`. If they reuse the key with a mutated payload, the server returns the cached `202 Accepted` of the original request, adhering to standard Stripe idempotency semantics.

### 3. Security Boundary: Downscoped STS Credentials (Replacing Confused Deputy)

**The Problem:** Passing `tenantId` explicitly into functional closures does not establish a cryptographic security boundary. If the Cloud Run service account has global storage permissions, an SSRF or logic bug allows cross-tenant data access.
**The Fix:**
Background workers must explicitly exchange their global service account token for a **Downscoped STS Token** via the GCP Security Token Service.

1. The worker extracts `tenantId` from the Cloud Task payload.
2. It requests a downscoped token with an IAM Credential Access Boundary strictly limiting `roles/storage.objectViewer` to `projects/_/buckets/ephemeral-ingest/objects/ingestions/tenants/{tenantId}/*`.
3. The worker uses this ephemeral token to read the payload. Any attempt to path-traverse or access other tenants' blobs is mathematically rejected by the GCP IAM control plane.

## 4. Conclusion

RFC v21 aligns completely with 2026 serverless standards. It guarantees high throughput, complete isolation, and O(1) processing times for the API Gateway, insulating the platform against volumetric and asymmetric DoS attacks.
