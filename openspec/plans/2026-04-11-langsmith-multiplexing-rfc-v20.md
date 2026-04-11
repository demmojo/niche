---
title: "RFC v20: LangSmith Multiplexing Protocol (Security & Concurrency Hardening)"
date: 2026-04-11
status: draft
dependencies: []
supersedes: [2026-04-11-langsmith-multiplexing-rfc-v19]
---

# RFC v20: LangSmith Multiplexing Protocol

## 1. Executive Summary

RFC v19 of the LangSmith Multiplexing Protocol failed in staging due to three fatal implementation-level flaws spanning the network edge (WAF), container lifecycle (Cloud Run CPU throttling), and data integrity (idempotency collisions).

RFC v20 comprehensively hardens the architecture by shifting defensive boundaries, correcting the asynchronous execution model, and implementing strict cryptographic determinism.

---

## 2. Architectural Flaws in v19 & v20 Resolutions

### 2.1. WAF Auth Bypass & Asymmetric DoS

**The Flaw (v19):** Unverified requests reached the Node.js backend. Malicious actors could send garbage JWTs, forcing the single-threaded Node.js Event Loop to perform expensive cryptographic signature validation math. This asymmetric workload starved the Event Loop, resulting in a severe Denial of Service (DoS).

**The Resolution (v20): WAF Adaptive Banning**
Node.js should never be the first line of defense for volumetric authentication attacks.

- **Implementation:** We will configure Google Cloud Armor (WAF) to dynamically ban abusive IP addresses at the edge.
- **Mechanism:** A WAF rule will monitor the rate of `401 Unauthorized` responses emitted by the backend per IP address. If an IP generates >5% `401` responses relative to its total traffic over a sliding window, Cloud Armor will dynamically insert an adaptive ban rule, blocking the IP at the network edge before it reaches the Cloud Run instances. This completely neutralizes the asymmetric CPU exhaustion.

### 2.2. The Confused Deputy & CPU Throttling

**The Flaw (v19):** To prevent HTTP timeouts, the system returned an early `202 Accepted` and offloaded the IAM fetch to a detached Stale-While-Revalidate (SWR) promise (`Promise.resolve().then()`). This caused two critical failures:

1.  **CPU Throttling:** Cloud Run's lifecycle model throttles CPU allocation to nearly zero the moment the HTTP response is sent. The background fetch froze mid-flight.
2.  **Confused Deputy:** Detached asynchronous execution lost the `AsyncLocalStorage` execution context, dropping the `tenantId` and causing authorization failures.

**The Resolution (v20): Request Collapsing (Single-Flight) with Kept-Alive Connections**
To maintain Cloud Run CPU allocation and prevent redundant cross-container work during traffic spikes, we will implement the **Single-Flight** pattern.

- **Local Collapsing:** Incoming identical requests will check an in-memory `Map<string, Promise>`. If a fetch is already in progress, the request will await the existing promise rather than initiating a new one.
- **Global Locking:** A Redis `SET NX px <timeout>` lock ensures that across multiple Cloud Run instances, only one container performs the expensive downstream operation.
- **Kept-Alive Connection:** Crucially, all concurrent incoming HTTP requests will **wait on the same local Promise** and hold the HTTP connection open. By not returning early, Cloud Run guarantees full CPU allocation for the duration of the fetch.
- **Context Preservation:** We will entirely bypass `AsyncLocalStorage` for this flow. The `tenantId` will be explicitly passed as a functional argument into the fetch closure to guarantee context preservation.

### 2.3. Idempotency Hash Collisions & Data Leaks

**The Flaw (v19):** The idempotency key was generated using naive concatenation: `JSON.stringify(payload) + jobId`.

1.  `JSON.stringify` is non-deterministic (key order matters).
2.  Missing `tenantId` allowed cross-tenant payload leaks if two tenants had identical payloads and job IDs.
3.  Lack of delimiters allowed boundary collisions (e.g., `tenant1` + `23` vs `tenant12` + `3`).

**The Resolution (v20): Cryptographic Idempotency**
The idempotency key generation must be mathematically safe and globally unique to the tenant boundary.

- **Implementation:** We will use `fast-json-stable-stringify` to guarantee a deterministic payload string regardless of object key insertion order.
- **Strict Delimiters:** We will inject the null byte (`\x00`) as a strict separator to prevent concatenation boundary attacks.
- **Hashing Algorithm:**

  ```javascript
  import stringify from "fast-json-stable-stringify";
  import crypto from "crypto";

  function generateIdempotencyKey(tenantId, payload, jobId) {
    const raw = `${tenantId}\x00${stringify(payload)}\x00${jobId}`;
    return crypto.createHash("sha256").update(raw).digest("hex");
  }
  ```

---

## 3. Implementation Steps

1.  **Infrastructure (Terraform):** Update `google_compute_security_policy` to include a rate-limit rule tracking `401` backend responses, enforcing a 5-minute ban block on offenders exceeding the threshold.
2.  **Backend (Node.js):**
    - Introduce `fast-json-stable-stringify` via `npm install`.
    - Replace `AsyncLocalStorage` usage in the multiplexer with explicit `tenantId` parameter passing.
    - Implement the `RequestCollapser` singleton using `Map<string, Promise>` and Redis `SET NX` commands.
3.  **Validation:** Perform load testing using Artillery to verify that 10,000 concurrent requests for the same `jobId` result in exactly 1 downstream fetch, 0 CPU throttles, and 0 memory leaks in the `Map`.
