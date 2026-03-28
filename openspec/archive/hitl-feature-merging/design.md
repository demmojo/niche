# Design: HITL Taxonomy Merging

## Context

The platform relies on Gemini 768D embeddings to calculate feature uniqueness against a global taxonomy. Over time, subjective merges by users could destroy the integrity of the 768D hypersphere. We must balance an instant, satisfying user experience with rigorous data integrity checks.

## Goals & Non-Goals

**Goals:**

- Provide a zero-latency UI experience for local feature merging.
- Programmatically discard subjective user merges from the global taxonomy.
- Ensure accurate $L_2$-normalized vector averaging.
- Safely cascade global taxonomy updates without corrupting historical states.

**Non-Goals:**

- Fully automated global taxonomy changes (a human Superadmin is required).
- Support for 1536D OpenAI embeddings (system is optimized specifically for Gemini 768D).

## Architectural Decisions

1. **React 19 `useOptimistic` + Shadow State:** To avoid the "Split-Brain" issue with standard Firebase syncs, we use React 19's `useOptimistic` for instant UI feedback. Firestore is updated via `runTransaction` to a `shadowTaxonomy` field with an `evaluationStatus: 'evaluating'` flag.
2. **Gemini 768D Fast-Path:** Vector math will strictly enforce 768D arrays. Computations will be done synchronously in Node.js using `Float32Array` and V8-optimized mathematical operations (e.g., `Math.log1p`). Inter-Process Communication (IPC) overhead from `SharedArrayBuffer` is explicitly rejected.
3. **Model-Aware Thresholds:** Cosine similarity thresholds are decoupled from hardcoded values. Instead of static 0.85/0.60 bounds (which break between embedding models), bounds will be configurable model-specific variables.
4. **Append-Only SCD Type 2 Taxonomy Rollback Model:** Global taxonomy records will never be updated or deleted. Merging Node A and B closes the records (`is_current: false`) and appends the new merged document within the exact same atomic transaction.
5. **Outbox Pattern for Scoring:** Heavy asynchronous market score recalculations triggered by a global merge will be written to a Firestore `outbox` subcollection, processed by a bounded `piscina` worker pool to prevent main-thread starvation.

## Risks & Trade-offs

- **Semantic Drift:** Equal averaging over many merges drags the semantic meaning toward the center. _Mitigation:_ Implementing Weighted Vector Averaging based on historical feature validation/usage counts.
- **Division by Zero:** Opposing vectors can sum to a zero-magnitude vector, causing `NaN` during normalization. _Mitigation:_ Added a specific zero-vector safeguard returning the origin array if `magnitudeSq === 0`.
- **LLM Cost & Latency:** High volume of borderline merges could spike LLM costs. _Mitigation:_ The fast-path cosine check serves as a gate; the LLM is strictly a fallback.

## Future Potential

Future iterations could introduce "Auto-Approve" queues for extremely high-confidence objective merges (e.g., > 0.98 similarity combined with multi-tenant identical merges) without Superadmin intervention.
