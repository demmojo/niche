# Design: Fundable ML Orchestration and Prompt System

## Context

Our AI operations require a robust backend to handle inference, evaluate new prompts, and collect telemetry. We are moving away from manual prompt tuning to an automated Champion-Challenger self-learning loop.

## Goals

- Implement Adaptive Semantic Routing via Contextual Queueing Bandits (CQB).
- Secure the generation layer against prompt injection using InstruCoT.
- Establish a "Gold Standard" ML Testing Pipeline using Pairwise Arena validation.
- Ensure zero memory leaks or database bloat from ML version tracking.
- Maintain absolute GDPR compliance within the data flywheel.

## Non-Goals

- Fine-tuning foundational models (we are using API-based models for now).
- Synchronous real-time prompt evaluation on the user-request path.

## Key Architecture Decisions

### 1. Model Tiering and Async CQB

**Decision**: Use an in-memory fast path + async batching for MAB (Multi-Armed Bandit) weights.
**Rationale**: To eliminate Firestore write contention. Weights are cached locally (`mabWeightsCache`). Telemetry is pushed to a bounded `p-queue` that dumps to `mab_telemetry_buffer`. A background worker aggregates this buffer every 5 minutes, recalculates distributions, and updates the Firestore singleton, triggering an `onSnapshot` refresh across nodes.

### 2. InstruCoT and Security Boundaries

**Decision**: Enforce CO-STAR prompts with XML boundaries (`<user_input>`) and Zod pre-flight checks.
**Rationale**: Before business logic runs, the LLM must populate a `securityAnalysis` JSON object determining if role confusion or override attempts are present. This prevents malicious prompts from hijacking the execution context.

### 3. Optimized SCD Type 2 Firestore Listeners

**Decision**: Explicitly filter `ml_configs` database listeners and manage garbage collection (GC).
**Rationale**: A known issue with SCD Type 2 versioning is memory bloat. We mitigate this by only querying `where('status', '==', 'champion')`, mapping docs to an immutable Map, stripping heavy metadata, and explicitly calling `unsubscribe()` on SIGTERM.

### 4. Tri-Modal Scoring & Memory-Safe Pairwise Evaluations

**Decision**: Use deterministic (Zod), semantic (Embeddings with `Float32Array` object pools), and heuristic (Blind A/B LLM-as-a-Judge) scoring.
**Rationale**: This ensures comprehensive evaluation. We use `setImmediate` chunking and Object Pools during Cosine Similarity comparisons to avoid blocking the Node.js V8 thread.

### 5. Hybrid Tokenization for PII

**Decision**: Combine fast Regex passes with a `gemini-3.1-flash-lite-preview` replacement step.
**Rationale**: Deleting PII destructively damages semantic embedding weight. Replacing "John at Stripe" with "[PERSON_1] at [ORG_1]" preserves semantic structure while maintaining GDPR compliance.

## Risks & Trade-offs

- **Risk**: Increased latency if the PII tokenization queue backs up.
  - **Mitigation**: Staging telemetry in `raw_eval_staging` with a 24-hour TTL; processing is fully asynchronous via background workers.
- **Risk**: LLM-as-a-Judge bias.
  - **Mitigation**: Blind the prompt outputs during head-to-head comparison and require a $>55\%$ win rate with $p < 0.05$ (Binomial Sign Test).
