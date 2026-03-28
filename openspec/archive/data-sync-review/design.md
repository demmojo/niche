## Context

NicheAI utilizes background and global sync tasks to enrich competitor profiles using APIs (Apollo.io, Gemini, Google Search). Today, when the `handleGlobalSync` or `runDiscovery` flow completes a step, it calls functions like `setCompetitors`, instantly overwriting fields such as `fundingHistory`, `coreFeatures`, and `techStack`. If users have manually verified, corrected, or input this data, the sync silently clobbers their work. This is unacceptable for a tool meant to curate and synthesize highly specific product intelligence.

## Goals / Non-Goals

**Goals:**
- Implement a centralized `SyncQueue` to intercept all automated or bulk data operations.
- Calculate and present a granular diff for each modified field.
- Prevent automated overwrites on any field the user has marked as "verified."
- Provide UI for users to select/deselect specific field updates, or perform a bulk "Accept All."
- Guarantee correctness through a comprehensive suite of unit, integration, and E2E (Playwright) tests.

**Non-Goals:**
- Creating a full revision history for every field (this change only manages the pending *incoming* sync vs the *current* state).
- Applying this review queue to minor manual text edits (these remain instant).

## Decisions

**1. Intercepting Automated State Changes**
- **Decision**: Refactor data-pulling hooks and the `handleGlobalSync` flow in `src/App.tsx`. Instead of calling `setCompetitors(prev => updatedCompetitors)`, they will call `queueSyncChanges(diffs)`.
- **Rationale**: This centralizes the gatekeeping. The system can compare the proposed data with the current state and only queue differences.

**2. Data Diff Structure (`SyncDiff`)**
- **Decision**: Define a new type `SyncDiff` that tracks: `entityType` (e.g., 'Competitor', 'Insight'), `entityId`, `field` (e.g., 'fundingHistory'), `oldValue`, and `newValue`.
- **Rationale**: This enables granular review in the UI. If a sync pulls updates for `techStack` and `targetAudience`, the user can accept one and reject the other.

**3. "Verified Data" Locking**
- **Decision**: Introduce a `verifiedFields` mapping (e.g., `verifiedFields: Record<string, boolean>`) on core entities like `Competitor`. If `verifiedFields['techStack']` is true, automated syncs will automatically discard incoming diffs for `techStack` (or flag them as 'conflict' for manual override).
- **Rationale**: Gives users absolute control over their curated data.

## Risks / Trade-offs

- **Risk: High Volume of Diffs** -> Syncing 50 competitors might yield hundreds of diffs, creating review fatigue.
- **Mitigation**: The review UI must be hierarchical (group by Competitor) and feature robust "Select All / Deselect All" controls at both the global and competitor levels. The default state for non-verified fields will be 'selected'.
- **Risk: Sync Queue Sticking** -> A new sync starts while a previous sync is still pending review.
- **Mitigation**: The system must enforce that a global sync cannot begin if the `SyncQueue` is non-empty, prompting the user to "Resolve pending syncs first."