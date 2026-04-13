# Proposal: Sovereign Blob Reference Protocol (SBRP) Data Plane

## Why

Recent adversarial reviews of RFC v26 highlighted critical distributed systems edge cases: Cross-Tenant IDOR squatting, Infinite Poison-Pill retry loops via background sweepers, SSRF Path Traversal bypasses on legacy URIs, Bandwidth Exhaustion from compressed zip bombs, and OTel spec contract drifts.

## What Changes

RFC v27 decouples compute from state management, shifts all garbage collection to infrastructure, isolates workloads via Bounded Node.js Worker Pools (matched with Cloud Run concurrency), enforces strict tenant authorization boundaries on state machine UPSERTs, neutralizes SSRF via robust URL parsing, and aligns with standard OTel semantic conventions.

## Capabilities

- Structural SSRF & IDOR Elimination.
- Deterministic State Machine & Idempotency logic for asynchronous retries.
- Synchronous Schema Validation (rejecting invalid payloads at ingress).
- Bandwidth Exhaustion and Decompression Bomb Protection.
- Client-Side OOM & MIME Spoofing Mitigation.

## Impact

Mathematical certainty in asynchronous processing and data sovereignty. It guarantees secure, exactly-once execution for massive LLM traces.
