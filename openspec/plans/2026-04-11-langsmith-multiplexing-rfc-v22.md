# RFC v22: Resilient Zero-Trust Asynchronous Multiplexing

**Status:** Proposed  
**Author:** NicheAI Architecture Team  
**Reviewers:** Engineering, Infrastructure, Security  
**Obsoletes:** RFC v21

## 1. Executive Summary

RFC v21 established a mathematically sound Zero-Trust architecture using Edge-First Auth, Asynchronous Claim Checks, and Downscoped STS credentials. However, the adversarial review exposed three critical composition failures: STS API rate limiting during retry storms, orphaned GCS blobs during network partitions, and cross-tenant idempotency collisions.

RFC v22 ("Resilient Zero-Trust Asynchronous Multiplexing") addresses these edge cases, hardening the architecture for production-grade reliability and strict tenant isolation at global scale.

## 2. Architectural Fixes & Hardening

### 2.1. Tenant-Namespaced Idempotency (Fixing State Confusion)

**The Problem:** v21 used the client-provided `X-Idempotency-Key` directly. If multiple tenants generated the same UUID (or maliciously collided them), Redis would return a cached 202 from the wrong tenant, leading to cross-tenant data leakage or Denial of Service.
**The Fix:**
The API Gateway / Ingress layer MUST cryptographically prefix all idempotency keys with the authenticated tenant ID before performing cache lookups.

- **Redis Key Format:** `idempotency:{tenantId}:{X-Idempotency-Key}`
- This guarantees mathematical isolation between tenants, even if they use identical idempotency keys.

### 2.2. Object Lifecycle Management (Fixing Orphaned Blobs)

**The Problem:** If the Node.js backend successfully writes the payload to Cloud Storage but fails to enqueue the Cloud Task (e.g., due to a regional GCP API outage), the blob is permanently orphaned, causing a slow storage cost hemorrhage.
**The Fix:**
The `ephemeral-ingest` bucket is now configured with an immutable **GCP Object Lifecycle Management (OLM) TTL**.

- Rule: `Action: Delete`, `Condition: Age > 24 hours`.
- This acts as a guaranteed garbage collector for any claim checks that fail to enqueue, ensuring the system fails safely and cost-effectively.

### 2.3. STS Token Caching & Jitter (Fixing the Cascade Retry Storm)

**The Problem:** A burst of tasks causes background workers to simultaneously request Downscoped STS Tokens. This exhausts the IAM STS `GenerateAccessToken` quota, resulting in 429s. Cloud Tasks then retries these tasks, creating a permanent retry storm that halts the system.
**The Fix:**
Workers must implement an in-memory **STS Token Cache** coupled with Exponential Backoff and Jitter.

1.  **Cache:** Since STS tokens are valid for up to 1 hour, the worker caches the downscoped token for `tenantId`. Subsequent tasks for the same tenant on the same worker instance reuse the token.
2.  **Backoff & Jitter:** If the STS API returns a 429, the worker does _not_ immediately fail. It applies a local retry with randomized jitter (e.g., `sleep(100ms * 2^attempt + random(50ms))`) before returning an error to Cloud Tasks. This breaks the synchronization of the retry storm and allows the STS quota to recover.

## 3. The Final Ingestion Flow

1. **Edge Auth:** API Gateway validates the JWT. Unauthenticated requests are dropped (0 Node.js CPU).
2. **Rate Limiting:** Node.js checks `Redis INCR rate_limit:{tenantId}`. If exceeded, returns `429`.
3. **Idempotency:** Node.js checks `Redis GET idempotency:{tenantId}:{X-Idempotency-Key}`. If found, returns the cached `202`.
4. **Claim Check:** Node.js writes payload to `gs://ephemeral-ingest/ingestions/tenants/{tenantId}/{uuid}.json`. (Bucket has 24h TTL).
5. **Enqueue:** Node.js dispatches Cloud Task containing the blob URI and `tenantId`.
6. **Async Response:** Node.js caches the `202` response in Redis and closes the HTTP connection.
7. **Zero-Trust Processing:** The Cloud Task worker pulls the STS token from cache (or fetches a new downscoped token), reads the blob, processes the multiplexed data, and deletes the blob upon success.

## 4. Conclusion

RFC v22 patches all known distributed systems edge cases. It provides absolute tenant isolation, prevents unauthenticated and authenticated resource exhaustion, and guarantees eventual cleanup of orphaned state. This architecture is fully ready for high-throughput, mission-critical LangSmith deployments.
