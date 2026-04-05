# Tasks: Enterprise ML Orchestration

## Phase 1: Infrastructure & Cloud Tasks

- [x] Implement `cloud_tasks_payloads` Firestore collection for the Claim Check pattern (handling payloads >100KB).
- [x] Implement client-facing HTTP 202 async endpoints that enqueue jobs into Google Cloud Tasks.
- [x] Implement worker endpoints that decode the payload, process the ML task, and write the terminal state to Firestore. The worker MUST hold the HTTP request open to ensure Cloud Run CPU allocation, and must be secured with `requireInternalOidc` middleware.

## Phase 2: Database & Routing (MAB)

- [x] Implement `ml_configs` Firestore collection with SCD Type 2 versioning and bounded `onSnapshot` queries.
- [x] Separate `PromptBanditOptimizer` from `aiClient.ts`, using Firestore Distributed Counters or Redis atomic `INCR` for Thompson Sampling weights, mathematical decay, and forced exploration logic.
- [x] Implement Zod `z.discriminatedUnion` for deterministic JSON extraction.
- [x] Implement explicit "Rate Limiting Safety" rule: Ensure HTTP 429 exhaustion defaults to a fail-closed or degraded state, with NO cross-tier escalation (e.g., Lite falling back to Pro).

## Phase 3: Validation, Promotion & Telemetry

- [x] Implement Tri-Modal Short-Circuit Waterfall utilizing `gemini-embedding-001` and Pairwise Dueling Bandits.
- [x] Implement `@stdlib/stats-ttest` Paired Student's t-test utility for Challenger promotion gating via `runTransaction`.
- [x] Implement telemetry pipeline to track User/AI Deltas with a PII-scrubbing middleware hook.

## Quality Gates

- [x] **Test Coverage (>80%)**: Intent-based tests written using MSW to verify fallback chains, 429 exponential backoff, and Cloud Tasks enqueuing.
- [x] Confirm transactional safety (`runTransaction`) for Champion promotion.
- [x] Verify worker endpoints correctly return errors/status via Firestore so clients do not hang.
