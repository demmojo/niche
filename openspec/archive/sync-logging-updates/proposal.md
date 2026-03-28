# Proposal: Sync Review Logging and Queue Coverage

## Objective
To ensure that all background data operations (like news discovery, insight generation, and competitor synthesis) correctly route their proposed changes through the new `SyncQueue` architecture instead of applying directly to the application state, and to update system logging to reflect the "Pending Review" status accurately. Furthermore, the Sync Review commit action should leave a clear audit log of accepted vs. discarded changes.

## Background
The application introduced a global `SyncQueue` and a Review UI to intercept automated changes, allowing users to vet incoming data. However, several automated tasks (e.g., Stage 4 Competitor Synthesis, Stage 5 System Context Generation, and manual News Discovery) were still bypassing the queue and mutating global state directly. Additionally, the System Logs were still reporting "Successfully updated" rather than indicating that changes were pending user review, leading to confusion.

## Proposed Changes
1. **Queue Integration for Missed Tasks:**
   - **Stage 4 (Synthesize Competitors):** Instead of calling `setCompetitors`, generate `SyncDiff` objects representing the new competitors and push them to the `SyncQueue`.
   - **Stage 5 (System Context):** Instead of calling `setSystemContextSummary`, `setDerivedInsights`, and `setMarketMetrics`, create `SyncDiff` objects (using `entityType: 'SystemContext'`) and push them.
   - **News Discovery:** Push the new news insights as `SystemContext` diffs rather than directly appending to `setDerivedInsights`.

2. **Logging Updates (Background Tasks):**
   - Update `addLog` and `updateLog` calls in `handleGlobalSync` (specifically Stage 4 and Stage 5) to state that the generated outputs are "Pending Review".
   - Modify the final successful sync log message to indicate: "Data successfully fetched. Changes are pending review."

3. **Audit Logging (Sync Review Modal):**
   - Update the `handleCommitSyncChanges` function to call `addLog` upon completion.
   - The log should explicitly state the number of changes committed and the number of changes discarded.

## Impact
These changes ensure 100% adherence to the `SyncQueue` architecture, preventing any rogue automated state mutations. The updated logs will provide users with accurate system status and a clear audit trail of their review decisions.
