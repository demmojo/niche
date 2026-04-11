---
status: proposed
supersedes: [2026-04-11-langsmith-multiplexing-rfc-v15]
dependencies: []
---

# RFC v16: LangSmith Multiplexing Protocol - Scale & Resilience Fixes

## 1. Executive Summary

RFC v15 successfully addressed poison pills and JWT data loss, but load testing and security audits revealed four new adversarial flaws and operational bottlenecks: STS IAM Quota Exhaustion under heavy load, Noisy-Neighbor Queue & Firestore DoS, BlobId Path Traversal vulnerabilities, and unrecoverable "Zombie Jobs".

RFC v16 introduces a hardened execution model. By implementing **Worker-Side STS Token Caching**, **Tenant-Aware Queue Partitioning**, **Strict BlobId Sanitization**, and an **Automated Sweeper Job**, we guarantee tenant fairness, protect downstream IAM quotas, and ensure eventually consistent state resolution.

## 2. Architectural Fixes

### 2.1 STS Token Cache (Resolving IAM Quota Exhaustion)

**Flaw in v15:** The worker dynamically generated an STS downscoped token for _every single task execution_. During high-throughput bursts, this dynamic generation overwhelmed the GCP IAM API, leading to `429 Too Many Requests` (Quota Exhaustion) and task failures.
**v16 Resolution:**

- **In-Memory Caching:** Workers will maintain an in-memory token cache (e.g., LRU Cache) keyed by `tenantId`.
- **Expiration Window:** GCP STS tokens are valid for 1 hour. The worker will cache the token and reuse it across all tasks for that `tenantId`.
- **Pre-emptive Refresh:** The cache will invalidate tokens 5 minutes before their actual 1-hour expiration to prevent edge-case failures during task execution, drastically reducing IAM API calls.

### 2.2 Fair Queuing & Partitioning (Resolving Noisy-Neighbor DoS)

**Flaw in v15:** All tasks were funneled into a single, global Cloud Tasks queue. A single chatty or adversarial tenant could flood the queue, starving other tenants and causing a massive spike in Firestore writes, leading to a Distributed Denial of Service (DoS).
**v16 Resolution:**

- **Queue Sharding (Fair Queuing):** We will provision $N$ independent Cloud Tasks queues (e.g., `multiplexer-queue-0` through `multiplexer-queue-9`).
- **Deterministic Dispatch:** The API Gateway will hash the `tenantId` (e.g., using CRC32 modulo $N$) to deterministically assign each tenant to a specific queue shard. This isolates heavy traffic to a single shard, protecting the rest of the system.
- **Ingestion Rate Limiting:** The API Gateway will implement strict ingestion rate limits per `tenantId` (using Redis `INCR` or a Firestore Sharded Distributed Counter, per project architecture rules) to drop abusive traffic (`429 Too Many Requests`) _before_ it reaches the queue.

### 2.3 Strict Regex Validation on BlobId (Resolving Path Traversal)

**Flaw in v15:** While `tenantId` was strictly validated, the `blobId` was passed directly to the Cloud Storage SDK without sanitization. An adversarial tenant could craft a `blobId` containing relative path sequences (`../`) or canonicalization exploits, bypassing logical tenant boundaries inside the bucket.
**v16 Resolution:**

- **Aggressive Sanitization:** The API Gateway and Worker must apply the exact same strict regex validation (`^[a-zA-Z0-9_-]+$`) to the `blobId` payload.
- **Immediate Rejection:** Any `blobId` containing periods, slashes, or special characters will be immediately rejected with a `400 Bad Request` at the gateway level, effectively neutralizing directory traversal vectors.

### 2.4 Sweeper Cron Job (Resolving Zombie Jobs)

**Flaw in v15:** If a worker instance crashed abruptly (e.g., OOM kill, Cloud Run eviction) while a task was mid-execution, the corresponding Firestore ledger document would remain stuck in a `"PROCESSING"` state infinitely.
**v16 Resolution:**

- **Automated Dead Letter Sweeper:** We will deploy a periodic Cloud Scheduler cron job that executes every 5 minutes against a dedicated `/sweep-zombie-jobs` endpoint.
- **State Reconciliation:** The sweeper will query Firestore for all job documents where `status == "PROCESSING"` and `updatedAt < (NOW() - 30 minutes)`.
- **Terminal Resolution:** The sweeper will atomically bulk-update these orphaned documents to `"FAILED"` with an error message indicating a worker crash. This guarantees state closure for the client polling mechanism.

## 3. Implementation Steps

1. **Validation Schemas:** Update the Zod schemas at the API boundary to enforce `^[a-zA-Z0-9_-]+$` on `blobId`.
2. **Queue Provisioning:** Update Terraform/infrastructure definitions to provision a pool of sharded Cloud Tasks queues.
3. **Gateway Dispatch:** Implement the hashing mechanism in the API Gateway to map `tenantId` to a specific queue, and integrate the Redis/Sharded Counter rate limiter.
4. **Worker Token Cache:** Implement an LRU cache module on the worker to store and retrieve STS tokens by `tenantId`, respecting the 55-minute TTL.
5. **Sweeper Endpoint:** Create a new authenticated backend endpoint that performs the Firestore query and batch update, and deploy a Cloud Scheduler job to invoke it every 5 minutes.
