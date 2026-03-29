# Tasks: Enterprise ML Orchestration

## Phase 1: Infrastructure & Queuing
- [ ] Provision Redis/BullMQ infrastructure with Sandboxed Processors (`concurrency: 5`), `lockDuration: 120000`, and `removeOnComplete: true`.
- [ ] Implement HTTP 202 async endpoints, ensuring graceful degradation for UI fallbacks.
- [ ] Write BullMQ `on('failed')` terminal states explicitly to Firestore to prevent client-side hanging.

## Phase 2: Database & Routing (MAB)
- [ ] Implement `ml_configs` Firestore collection with SCD Type 2 versioning and bounded `onSnapshot` queries.
- [ ] Separate `PromptBanditOptimizer` from `aiClient.ts`, using Redis atomic `INCR` for Thompson Sampling weights, mathematical decay, and forced exploration logic.
- [ ] Implement Zod `z.discriminatedUnion` for deterministic JSON extraction.

## Phase 3: Validation, Promotion & Telemetry
- [ ] Implement Tri-Modal Short-Circuit Waterfall utilizing `gemini-embedding-001` and Pairwise Dueling Bandits.
- [ ] Implement `@stdlib/stats-ttest` Paired Student's t-test utility for Challenger promotion gating via `runTransaction`.
- [ ] Implement telemetry pipeline to track User/AI Deltas with a PII-scrubbing middleware hook.

## Quality Gates
- [ ] **Test Coverage (>80%)**: Intent-based tests written using MSW to verify fallback chains, 429 exponential backoff, BullMQ job enqueuing, and legacy synchronous endpoint backward compatibility.
- [ ] Confirm transactional safety (`runTransaction`) for Champion promotion.
- [ ] Verify BullMQ workers demonstrate successful parallel processing without V8 thread starvation.