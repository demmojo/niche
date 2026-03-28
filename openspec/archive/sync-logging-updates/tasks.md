## 1. Implement Queue Routing for Missed Tasks

- [x] 1.1 In `src/App.tsx`, locate Stage 4 (Synthesize Competitors) of `handleGlobalSync`. Replace the direct `setCompetitors` call with logic to generate `SyncDiff` objects (using `field: 'new_competitor'`) and pass them to `queueSyncChanges`.
- [x] 1.2 In `src/App.tsx`, locate Stage 5 (System Context) of `handleGlobalSync`. Replace direct state setter calls for summary, insights, and metrics with `SyncDiff` creation (using `entityType: 'SystemContext'`) and queue them.
- [x] 1.3 In `src/App.tsx`, locate the `runNewsDiscovery` (or equivalent Exa search) function. Change the direct `setDerivedInsights` call to queue the newly generated insights as `SyncDiff` objects.

## 2. Update System Logs for "Pending Review" Status

- [x] 2.1 Update the `updateLog` calls in Stage 4 to reflect that synthesized competitors are "(Pending Review)".
- [x] 2.2 Update the `updateLog` calls in Stage 5 to indicate that the generated insights and context are "(Pending Review)".
- [x] 2.3 Update the final success log in `handleGlobalSync` to read: "Data successfully fetched. Changes are pending review."
- [x] 2.4 Ensure the log messages in `runDiscovery` and `updateSystemContext` consistently use the "(Pending Review)" terminology where applicable.

## 3. Implement Sync Review Audit Logs

- [x] 3.1 In `src/App.tsx`, locate `handleCommitSyncChanges`.
- [x] 3.2 Add an `addLog` call after changes are processed that records the audit trail: e.g., "Committed X changes. Discarded Y changes." with status 'success'.