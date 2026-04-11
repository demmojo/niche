# RFC v11: LangSmith Multiplexing Protocol - Data Plane Resilience & Security Hardening

**Author:** NicheAI Architecture Group  
**Status:** Proposed (Supersedes v10)  
**Date:** April 11, 2026

## 1. Executive Summary

RFC v10 introduced the core LangSmith Multiplexing Protocol but failed security audits due to four critical adversarial data plane vulnerabilities. These vulnerabilities allowed attackers to corrupt counter states, force race conditions in worker execution, amplify event throughput to exhaust bandwidth, and trigger Worker Out-Of-Memory (OOM) crashes via malicious payloads.

This document, RFC v11, introduces four definitive architectural pillars to harden the data plane:

1. **Sliding Window Rate Limiting** to replace brittle TTL-based counters.
2. **Velocity Quotas** to bound cumulative data throughput over time.
3. **Idempotent Receiver Pattern** to guarantee exactly-once processing safely.
4. **Bounded Streaming Parsers** to eliminate Event Loop Starvation and OOMs.

---

## 2. Vulnerability Resolutions & Detailed Design

### 2.1. Counter State Corruption

**Vulnerability (v10):** Shared Key TTL mismatch. Using Redis `INCR` combined with `EXPIRE` led to race conditions where the TTL expired but the counter remained, or concurrent requests bypassed limits under high contention.
**Resolution (v11):** **Sliding Window Rate Limiting via Redis Sorted Sets (ZSET)**

We abandon naive `INCR` in favor of a mathematically rigorous Sliding Window using Redis `ZSET`.

**Implementation Details:**

- **Key Structure:** `ratelimit:{tenant_id}:{endpoint}`
- **Score & Value:** Both set to the current timestamp (in milliseconds or microseconds). To ensure uniqueness in the value, we append a random nonce: `<timestamp>:<uuid>`.
- **Atomic Evaluation (Lua Script):**
  We use a single Lua script to guarantee atomicity and prevent race conditions:

```lua
-- KEYS[1]: limit_key
-- ARGV[1]: window_start_ms (current_time - window_size)
-- ARGV[2]: current_time_ms
-- ARGV[3]: max_requests
-- ARGV[4]: unique_request_id (e.g., timestamp:uuid)

redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', ARGV[1])
local current_count = redis.call('ZCARD', KEYS[1])

if current_count < tonumber(ARGV[3]) then
    redis.call('ZADD', KEYS[1], ARGV[2], ARGV[4])
    redis.call('EXPIRE', KEYS[1], math.ceil((tonumber(ARGV[2]) - tonumber(ARGV[1])) / 1000))
    return 1 -- Allowed
else
    return 0 -- Rate Limited (429)
end
```

_Trade-off Note:_ `ZADD` and `ZREMRANGEBYSCORE` are $O(\log(N))$. By keeping the window size small (e.g., 60 seconds) and the max requests bounded, $N$ remains trivial, preserving sub-millisecond latency.

### 2.2. Sequential Velocity DoW via Event Amplification

**Vulnerability (v10):** Attackers sequentially looped 500MB payload uploads. Because they never exceeded the _concurrent_ active connection limit, they bypassed concurrency gates, resulting in massive bandwidth exhaustion (Denial of Wallet).
**Resolution (v11):** **Velocity Limits (Byte/Time Quotas) alongside Concurrency Limits**

We introduce a dual-axis throttling mechanism. Concurrency limits protect _immediate compute_, while Velocity Limits protect _infrastructure cost and bandwidth_.

**Implementation Details:**

- **Pre-Flight Byte Check:** Before parsing the body, the HTTP `Content-Length` (or streamed byte counter) is evaluated against the tenant's remaining velocity quota.
- **Distributed Leaky Bucket for Bytes:**
  We implement a Redis-backed byte counter tracking cumulative bytes processed per hour: `velocity_bytes:{tenant_id}:{hour_bucket}`.
- **Enforcement:**

  ```typescript
  // Pre-parser middleware
  const MAX_BYTES_PER_HOUR = 2 * 1024 * 1024 * 1024; // 2GB
  const byteCost = parseInt(req.headers["content-length"] || "0", 10);

  const currentUsage = await redis.incrby(
    `velocity:${tenantId}:${currentHour}`,
    byteCost,
  );
  await redis.expire(`velocity:${tenantId}:${currentHour}`, 3600 * 2); // 2h TTL

  if (currentUsage > MAX_BYTES_PER_HOUR) {
    throw new HttpError(429, "Velocity Limit Exceeded: 2GB/hr max.");
  }
  ```

### 2.3. At-Least-Once Delivery Race in Idempotency Ledger

**Vulnerability (v10):** Concurrent webhook/worker executions bypassed the idempotency check because the read-and-write operations were not atomic.
**Resolution (v11):** **Strict Idempotent Receiver Pattern via Atomic Primitives**

To prevent duplicate execution (especially for billing or destructive actions), idempotency must be locked at the infrastructure boundary before application logic executes.

**Implementation Details:**

- **Unique Key:** Derived deterministically from the payload (e.g., `event_id` or a hash of the `object_uri`).
- **Primary Mechanism (Redis SETNX):**
  For high-throughput, ephemeral deduplication (e.g., 24-hour webhooks):
  ```typescript
  // Returns 1 if key was set (first time), 0 if it already existed
  const acquired = await redis.set(
    `idempotency:${eventId}`,
    "PROCESSING",
    "NX",
    "EX",
    86400,
  );
  if (!acquired) {
    return res
      .status(202)
      .send({ status: "Accepted", detail: "Already processing/processed" });
  }
  ```
- **Secondary Mechanism (Firestore Transactions):**
  For permanent deduplication (Claim Check pattern):
  ```typescript
  await firestore.runTransaction(async (transaction) => {
    const ledgerRef = firestore.collection("event_ledger").doc(eventId);
    const doc = await transaction.get(ledgerRef);
    if (doc.exists) {
      throw new IdempotencyConflictError("Event already recorded");
    }
    transaction.set(ledgerRef, {
      status: "RECEIVED",
      timestamp: FieldValue.serverTimestamp(),
    });
  });
  ```

### 2.4. Worker OOM via Malicious Payload Structure

**Vulnerability (v10):** Attackers crafted payloads with 10,000+ levels of JSON nesting or extremely wide objects. `JSON.parse()` builds the entire AST in memory, leading to V8 Event Loop Starvation and OOM crashes.
**Resolution (v11):** **Bounded Streaming Parsers & Opaque Pass-Through**

Workers must never buffer uncontrolled external payloads into memory using synchronous `JSON.parse()`.

**Implementation Details:**

1. **Opaque Pass-Through (Preferred):**
   If the worker merely routes the LangSmith payload to a downstream destination (e.g., BigQuery or a blob store), the payload is treated as an opaque `Buffer` stream. It is piped directly to the destination without AST parsing.
   ```typescript
   req.pipe(destinationStream); // Zero-AST parsing
   ```
2. **Bounded Depth/Breadth Parsing (When inspection is required):**
   When the worker must inspect the payload, we mandate the use of SAX-like streaming parsers (e.g., `stream-json` or `JSONStream`) coupled with explicit depth constraints.

   ```typescript
   import { parser } from "stream-json";

   const jsonParser = parser();
   let currentDepth = 0;

   jsonParser.on("data", ({ name, value }) => {
     if (name === "startObject" || name === "startArray") currentDepth++;
     if (name === "endObject" || name === "endArray") currentDepth--;

     if (currentDepth > 10) {
       // Strict recursion depth cap
       req.destroy();
       throw new Error("Payload Exceeds Maximum Nesting Depth of 10");
     }
   });

   req.pipe(jsonParser);
   ```

3. **Middleware Protections:**
   All Express servers MUST configure strict body size limits before attempting to parse JSON:
   ```typescript
   app.use(express.json({ limit: "100kb", type: "application/json" }));
   ```

---

## 3. Deployment & CI/CD Checklist

To ensure these principles are not degraded over time, the following checks are mandated for merge:

- [ ] **Chaos Tests:** Generate 500 concurrent identical `event_id` requests to prove the `SETNX`/`runTransaction` Idempotent Receiver drops 499 of them.
- [ ] **Malicious Payload Tests:** Pipe a 1GB JSON file with 5,000 levels of nesting and assert the request is aborted with `400 Bad Request` in under 50ms without V8 memory spiking.
- [ ] **Velocity Profiling:** Loop small payload requests to exhaust the hourly byte quota and assert `429 Too Many Requests` is returned correctly.

## 4. References & NicheAI Compliance

- Compliant with **NicheAI AGENTS.md**: _"Resource Exhaustion Protection... strict maximum recursion depths (e.g., 10 levels) and string length checks before parsing JSON to prevent Event Loop Starvation."_
- Compliant with **NicheAI AGENTS.md**: _"Firestore Patterns: Mandate `runTransaction`... Use `writeBatch` for atomic data migrations."_
