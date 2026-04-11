# RFC v18: LangSmith Multiplexing Protocol - Distributed Systems Hardening

## Metadata

- **Date:** 2026-04-11
- **Author:** best-practices-researcher
- **Status:** Proposed
- **Dependencies:** []

## Executive Summary

RFC v17 successfully established the baseline asynchronous Multiplexing Protocol for LangSmith event ingestion. However, integration testing revealed three critical distributed systems failure modes under horizontal scaling and high-concurrency conditions: the Horizontal Scaling Illusion, the Side-Effect Mirage, and the Head-of-Line Blockade. RFC v18 conclusively resolves these vulnerabilities by moving rate-limiting to the ingress edge, implementing distributed Redis locking for cache stampede prevention, and enforcing strict Stripe-style HTTP idempotency for all downstream mutative operations.

## Problem Statement (The v17 Gaps)

1. **The Horizontal Scaling Illusion (Cache Stampede):** v17 utilized a local Node.js `Map` for STS (Short-Term Storage) Promise deduplication. Under horizontal auto-scaling (e.g., Cloud Run scaling from 1 to 10 instances), requests hitting different instances bypassed the local deduplicator, causing a cache stampede against the underlying datastore.
2. **The Side-Effect Mirage (Worker vs. Timeout Race):** In v17, if a worker node stalled and the 30-minute Timeout Task triggered a retry, the worker and the retry could execute simultaneously. Despite database-level locks for internal state, external API calls (e.g., sending telemetry to LangSmith) lacked transaction boundaries, resulting in duplicate downstream data.
3. **Exploiting True Tenant Rate Limiting (Head-of-Line Blockade):** Rate limiting was evaluated _after_ a message was pulled from the shared worker queue. A malicious or hyper-active tenant could flood the queue; even if their tasks were correctly rate-limited and dropped by the worker, they occupied queue capacity, starving legitimate traffic from other tenants (Head-of-Line blocking).

## Architectural Solutions

### 1. Ingress Rate Limiting (Token Bucket at API Gateway)

**Concept:** Shift-Left the tenant rate limiting from the asynchronous consumer to the synchronous API Gateway ingress.
**Implementation:**

- Implement a Redis-backed Token Bucket algorithm at the API Gateway layer.
- Evaluate rate limits synchronously upon receiving the request.
- If a tenant exceeds their quota, immediately return a `429 Too Many Requests` response.
- **Result:** Malicious or runaway tasks never enter the Cloud Tasks queue. Queue capacity is strictly preserved for valid, processable workloads, entirely eliminating Head-of-Line starvation. This aligns with standard edge-protection best practices.

### 2. Distributed Cache Stampede Prevention (Redis Lock)

**Concept:** Elevate promise deduplication from local memory to a distributed lock mechanism.
**Implementation:**

- Deprecate the local Node.js `Map` for STS Promise deduplication.
- Introduce a distributed Redis lock (e.g., Redlock pattern or standard Redis `SET NX EX`).
- **Flow:**
  1. Attempt to read from the distributed Redis cache.
  2. On cache miss, attempt to acquire the Redis lock for the specific cache key.
  3. If lock acquired: Compute the result, write to the Redis cache, and release the lock.
  4. If lock denied (another instance is computing): Fall into a bounded exponential backoff polling loop (or Redis Pub/Sub subscription) waiting for the cache to be populated by the lock owner.
- **Result:** Horizontal auto-scaling no longer bypasses deduplication. A single source of truth prevents the datastore from being overwhelmed by synchronized fleet-wide cache misses.

### 3. Downstream Idempotency (Stripe-Style Idempotency Keys)

**Concept:** Decouple external side-effects from internal transaction bounds by passing the idempotency burden to the downstream API.
**Implementation:**

- Mandate that all downstream external API calls (such as LangSmith telemetry) support and enforce an `Idempotency-Key` HTTP header.
- The worker passes the unique `jobId` (or a deterministic derivative like `task_id + attempt_number`) as the `Idempotency-Key`.
- **Result:** If the 30-minute Timeout Task triggers a retry and a race condition occurs, the external LangSmith API will intercept the duplicate `Idempotency-Key` and silently return the cached HTTP 2xx response of the original successful request, decisively preventing double-writes.

## References & Industry Best Practices

- **Stripe Idempotency Pattern:** Standardizing on HTTP header-based idempotency keys to safely retry mutative API requests over unreliable networks.
- **Redis Distributed Locks (Redlock):** For distributed lock management ensuring mutually exclusive access to shared resources across independent ephemeral nodes.
- **Edge Token Bucket Rate Limiting:** Efficient, constant-memory algorithm for network traffic shaping at the ingress edge to protect asynchronous queues from DoS via starvation.
