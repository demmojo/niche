---
status: proposed
supersedes: [2026-04-11-langsmith-multiplexing-rfc-v16]
dependencies: []
---

# RFC v17: LangSmith Multiplexing Protocol - Security & Resilience Hardening

## 1. Executive Summary

While RFC v16 introduced STS Caching, Queue Partitioning, and an Automated Sweeper, stress testing and adversarial audits revealed four critical flaws: Cache Stampedes exhausting IAM APIs, Privilege Revocation Lag allowing suspended users access, Static Sharding causing Noisy-Neighbor starvation, and Resurrected Zombie Tasks corrupting state ledgers.

RFC v17 conclusively closes these gaps. By implementing **Promise Deduplication (Mutex)**, **Fast-Path Revocation with Short TTLs**, **True Tenant Rate Limiting via Fair Queuing**, and **Event-Driven Dead Lettering with Optimistic Locking**, we guarantee robust multi-tenant isolation, instantaneous privilege revocation, and mathematically sound state consistency.

## 2. Architectural Fixes

### 2.1 Promise Deduplication (Resolving Cache Stampedes)

**Flaw in v16:** When a tenant's token expired, 500 concurrent requests could simultaneously miss the cache, triggering 500 redundant IAM API calls and causing GCP Quota exhaustion.
**v17 Resolution:**

- **Promise Map (Mutex):** The STS token cache will implement strict promise deduplication. If a token fetch is in flight for a `tenantId`, subsequent concurrent requests will await the existing Promise rather than initiating new network calls.
- **Outcome:** Guarantees exactly _one_ IAM API call per tenant cache miss, regardless of concurrency spikes.

### 2.2 Fast-Path Revocation & Short TTLs (Resolving Privilege Revocation Lag)

**Flaw in v16:** A 55-minute STS cache TTL meant that if a malicious tenant was suspended, they retained write access for nearly an hour before the token expired.
**v17 Resolution:**

- **Short TTLs:** Reduce the STS token cache TTL to 5 minutes.
- **Async Background Refresh:** Tokens will be refreshed asynchronously in the background before expiration to prevent latency hits on the critical path.
- **Distributed Revocation Check:** Before returning a token (even from the in-memory cache), the worker will perform a microsecond check against a distributed revocation list (e.g., Redis) to ensure the tenant hasn't been suspended.

### 2.3 True Tenant Rate Limiting (Resolving Static Sharding Collateral Damage)

**Flaw in v16:** Modulo hashing deterministically assigned multiple tenants to the same queue shard. A malicious tenant could flood their assigned shard, starving innocent tenants who happened to hash to the same queue.
**v17 Resolution:**

- **Fair Queuing:** Abandon static modulo sharding.
- **Dynamic Token Buckets:** Implement consumer-side Fair Queuing using Redis Token Buckets to enforce dynamic concurrency limits per tenant.
- **Unified Queue Extraction:** Workers will pull from a unified queue (or dynamically provisioned, tenant-isolated shards) ensuring that no single tenant can consume more than their fair share of total processing capacity.

### 2.4 Event-Driven Dead Lettering & Optimistic Locking (Resolving Resurrected Zombie Tasks)

**Flaw in v16:** The global Cron Sweeper marked slow tasks as `FAILED`, but if the delayed worker eventually finished, it blindly overwrote the state with `SUCCESS`, resurrecting a zombie task and corrupting the state ledger.
**v17 Resolution:**

- **Parallel Timeout Task:** Abolish the global Cron Sweeper. When a task is queued, enqueue a parallel "Timeout Task" with a 30-minute delay.
- **Optimistic Locking (`runTransaction`):** Mandate that all worker final writes use Firestore `runTransaction`.
- **Abort on FAILED:** The transaction must read the current state and safely abort if the state is already marked `FAILED` by the timeout task, preventing zombie resurrections.

## 3. Implementation Steps

1. **STS Mutex:** Refactor the STS cache to use a `Map<string, Promise<Token>>` to block cache stampedes.
2. **Revocation List:** Deploy a Redis-backed revocation list and integrate the 5-minute TTL with async background refresh.
3. **Fair Queuing Configuration:** Replace modulo hashing with Redis Token Buckets and a unified queueing strategy.
4. **Timeout Tasks & Transactions:** Update the queue publisher to dispatch the delayed Timeout Task, and refactor the worker ledger updates to use `runTransaction` with strict state checks.
