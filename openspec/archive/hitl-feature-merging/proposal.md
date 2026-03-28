# Proposal: Human-in-the-Loop (HITL) Taxonomy Merging

## Why

When AI parses competitor websites, functionally identical features are frequently given different names (e.g., "Email Sequences" vs. "Drip Campaigns"). This naming inconsistency inflates the "Vector Uniqueness" score for users, leading to inaccurate market viability assessments. While users need the ability to merge features to correct their local view, allowing unvalidated user merges to automatically update the global vector taxonomy risks polluting the system with highly subjective, project-specific groupings.

## What Changes

We are introducing a Human-in-the-Loop (HITL) merging system. Users can select multiple similar competitor features and merge them into a new feature with a custom name. This applies immediately to their local "Shadow Taxonomy." In the background, a Hybrid Validation Pipeline (Cosine Similarity + LLM-as-a-Judge) evaluates the merge. If the AI determines it is an objective synonym (rather than a subjective grouping), the merge is queued for Superadmin approval. Once approved, it cleanly updates the global niche taxonomy.

## Capabilities

- **Optimistic Merging UI:** Users can instantly merge features locally using a React 19 optimistic UI paired with a Firestore Document-Level Shadow State.
- **Robust Vector Math:** Calculates weighted L2-normalized averages of the merged vectors, with safeguards against zero-vector anomalies.
- **Hybrid Validation Engine:** Evaluates merges via fast cosine similarity bounds, falling back to a structured LLM Chain-of-Thought judge for borderline cases.
- **Superadmin Evaluation Dashboard:** Provides admins with a Pre-Flight Impact Radius tool to see how merging vectors will alter existing projects' viability scores before committing changes.
- **Safe Global Cascades:** Uses an Append-Only SCD Type 2 model and an Outbox pattern to update global taxonomies without causing data anomalies or sudden score drops without notifying founders.

## Impact

- Prevents "Semantic Drift" and protects global taxonomy integrity.
- Improves the accuracy of user Vector Uniqueness scores.
- Unlocks crowdsourced, high-quality feature deduplication.
- Maintains UI responsiveness through async AI evaluation.
