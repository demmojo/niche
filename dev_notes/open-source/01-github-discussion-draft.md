# [RFC] The 100MB+ Trace Problem: Enterprise Data Sovereignty & The Asynchronous "Claim-Check" Pattern

Hi everyone 👋,

As AI applications evolve from simple text generation to massive, multimodal agent swarms, our team has hit a wall that I suspect many of you are also facing: **Tracing massive contexts is breaking standard observability pipelines.**

When a single LLM trace involves 50MB of PDF parsing, 10MB of scraped HTML, and 100+ agent reasoning loops, sending this payload synchronously in-band causes severe issues:

1. **SDK / Compute Plane OOMs:** Serializing and transmitting 100MB+ JSON payloads blocks the event loop and crashes worker nodes.
2. **SaaS Ingress Costs:** Pumping gigabytes of raw context over the wire to hosted observability platforms (like LangSmith or generic APMs) results in exorbitant bandwidth and storage bills.
3. **Enterprise Compliance Blockers:** Healthcare and FinServe clients simply cannot send massive, unredacted raw datasets (PII/PHI) out of their VPCs to third-party SaaS providers.

We'd love to propose an architectural paradigm shift—an open standard we've been internally drafting called the **Sovereign Blob Reference Protocol (SBRP)**—and get this community's feedback before submitting any PRs.

## The Proposal: The Asynchronous Claim-Check Pattern

Instead of forcing the entire trace payload over the wire synchronously, we propose a formalized **Claim-Check Pattern** built on OpenTelemetry semantic conventions.

**How it works:**

1. **Sovereign Storage:** The SDK (Compute Plane) streams the massive raw payload directly into a _customer-owned_, isolated blob storage bucket (e.g., S3, GCS) within their own VPC.
2. **The Reference Span:** The SDK emits a lightweight, immutable OTel span referencing the payload. It only contains:
   - `sbrp.blob_reference.blob_id`: A UUIDv7 trace identifier.
   - `sbrp.blob_reference.storage_route.alias`: A tenant-defined alias pointing to their bucket.
   - `sbrp.blob_reference.checksum`: A SHA-256 hash for integrity.
3. **Async Ingestion (202 Accepted):** The Observability Data Plane receives the lightweight span, immediately returns `202 Accepted`, and offloads the heavy lifting (fetching, parsing, and indexing the sovereign blob) to background workers.

## Why We Think This is Necessary for the Community

- **Unblocks Enterprise Sales:** Customers keep full ownership and sovereignty over their raw data. They only grant the observability platform read-only, time-bound access.
- **Slashes Infrastructure Costs:** It shifts the bulk of ingress and storage costs from the SaaS provider back to the customer's own cloud infrastructure.
- **Prevents Agent Crashes:** It replaces blocking, synchronous JSON serialization with asynchronous, chunked streaming to object storage.
- **Security First:** By relying on `storage_route.alias` mapped server-side rather than accepting full URLs in the payload, this pattern structurally eliminates Server-Side Request Forgery (SSRF) vulnerabilities.

## Why We Are Posting This

We want to build this _with_ the community, not just drop a massive, highly-opinionated PR into the repo.

Is the maintainer team open to collaborating on this ingestion pathway? We have already drafted a comprehensive RFC handling the distributed systems edge cases (Idempotency state-machines, Decompression Bomb limits, TOCTOU races, Cross-Tenant IDOR mitigations). If there is interest, our team would love to contribute the implementation for both the backend async ingestion and the SDK outbox layers.

Would love to hear your thoughts on this architecture! Does this align with the roadmap for handling multimodal agent traces?

Thanks,
[Your Name / NicheAI Engineering Team]
