# Specification: HITL Taxonomy Merging

## 1. Local UI & Vector Merging (`ComputeMeter.tsx`)

Users select multiple features to merge and provide a custom name.

### Scenarios

**Scenario 1: User merges features locally**

- **WHEN** a user selects "Email Sequences" and "Drip Campaigns" and clicks "Merge".
- **THEN** the React 19 optimistic UI instantly removes both, displaying the new merged feature with a dashed "Evaluating" visual state.
- **AND** a weighted, $L_2$-normalized average vector of the combined features is calculated.
- **AND** a Firestore transaction commits the new `shadowTaxonomy` state to the user's document.

## 2. Hybrid Validation Pipeline

Upon local merge, an async job evaluates the vectors using Model-Aware Thresholds.

### Scenarios

**Scenario 2: Objective Synonym (High Similarity)**

- **WHEN** the Cosine Similarity of the merged features is greater than `threshold.objective`.
- **THEN** the pipeline classifies it as an Objective Synonym and pushes the proposal to the `taxonomy_proposals` Firestore collection.

**Scenario 3: Subjective Grouping (Low Similarity)**

- **WHEN** the Cosine Similarity is less than `threshold.subjective`.
- **THEN** the pipeline safely halts global processing.
- **AND** the local feature's visual state updates to a solid Approved state (Local Only).

**Scenario 4: Borderline LLM Verification**

- **WHEN** the Cosine Similarity falls between the objective and subjective thresholds.
- **THEN** an LLM-as-a-Judge is prompted using Chain-of-Thought (forcing `reasoning_feature_a`, `reasoning_feature_b`, and `boundary_analysis` outputs).
- **AND IF** the LLM returns `OBJECTIVE_SYNONYM` with confidence >= 0.90, it proceeds to the Superadmin queue.

## 3. Superadmin Evaluation Queue & Global Cascade

Superadmins review validated merges to update the system globally.

### Scenarios

**Scenario 5: Superadmin Pre-Flight Review**

- **WHEN** a Superadmin opens a proposal in the dashboard.
- **THEN** they view a "What-If" score delta table showing the top 10 projects most impacted by the merge.

**Scenario 6: Global Taxonomy Update**

- **WHEN** a Superadmin clicks "Approve".
- **THEN** the original taxonomy vectors are marked `is_current: false` and a new document is appended (SCD Type 2).
- **AND** an outbox event is created to background-recalculate `current_market_score` for affected projects.
- **AND** if a project's score shifts past a warning threshold, a "Market Shift" notification is generated for the affected founder.
