# Tasks

## Phase 1: Local Vector Math & UI Scaffolding

- [x] Update `ComputeMeter.tsx` to support multi-selection of features.
- [x] Create a "Merge" modal prompting for a custom combined feature name.
- [x] Implement `mergeVectors(vectors, weights)` utility in TypeScript, ensuring $L_2$ normalization, zero-vector safeguards, and `Float32Array` usage.
- [x] Write unit tests for vector math proving no `NaN` division-by-zero outputs.

## Phase 2: Optimistic UI & Firestore Shadow State

- [x] Implement React 19 `useOptimistic` for the feature list to instantly reflect merges locally.
- [x] Create Firestore `runTransaction` logic to update the user's document `shadowTaxonomy` field with `evaluationStatus: 'evaluating'`.
- [x] Add visual state indicators (Dashed/Spinning for 'evaluating', Solid/Check for 'approved').

## Phase 3: Hybrid Validation Pipeline

- [x] Build backend async pipeline for Cosine Similarity calculation.
- [x] Implement Model-Aware Configuration objects for thresholds (moving away from hardcoded 0.85/0.60).
- [x] Integrate LLM-as-a-Judge fallback for borderline similarity scores using structured Chain-of-Thought output.
- [x] Implement exponential backoff for the LLM request, defaulting to local-only Subjective Grouping on terminal failure.

## Phase 4: Superadmin Dashboard & Queue

- [x] Create the `taxonomy_proposals` Firestore collection schema.
- [x] Build the Superadmin Dashboard list view for pending proposals.
- [x] Implement the "Pre-Flight Impact Radius" calculation to show score deltas for affected projects.

## Phase 5: Global Cascades & Outbox

- [x] Implement the Append-Only SCD Type 2 logic for taxonomy document appending.
- [x] Build the transactional Outbox pattern to emit scoring recalculation events on merge approval.
- [x] Configure the bounded `piscina` worker pool for outbox processing.
- [x] Wire up the "Market Shift" UI notification for founders whose project viability scores change.
