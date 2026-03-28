## 1. Data Models and State Initialization

-[x] 1.1 Update `Competitor` and `MyProductData` interfaces in `src/types.ts` to include a `verifiedFields: Record<string, boolean>` object.
-[x] 1.2 Create a `SyncDiff` interface for representing granular changes (e.g., `entityId`, `entityType`, `field`, `oldValue`, `newValue`).
-[x] 1.3 Add a `syncQueue: SyncDiff[]` global state or hook (`useSyncQueue`) to manage pending automated data.

## 2. Refactoring Data Retrieval Functions

-[x] 2.1 Refactor `handleGlobalSync` (Apollo.io, Google Search enrichment steps) to generate `SyncDiff` objects instead of calling `setCompetitors` directly.
-[x] 2.2 Refactor `updateSystemContext` and `runDiscovery` to push new findings (like new competitors or system insights) into the `SyncQueue`.
-[x] 2.3 Implement logic in the queue function to compare incoming data against `verifiedFields`. If a field is verified, discard the diff or mark it as a conflict defaulting to false.
-[x] 2.4 Add logic to prevent `handleGlobalSync` from starting if `syncQueue.length > 0`.

## 3. UI: Sync Review Queue

-[x] 3.1 Build a "Sync Pending Review" banner/notification that appears when the `SyncQueue` is non-empty.
-[x] 3.2 Create a "Sync Review Modal" that displays a grouped list of `SyncDiff` objects (grouped by Competitor/Entity).
-[x] 3.3 Implement granular checkboxes next to each field diff (`techStack`, `fundingHistory`, etc.) allowing the user to select/deselect specific updates.
-[x] 3.4 Add "Select All" / "Deselect All" capabilities at the global level and at the per-competitor group level.
-[x] 3.5 Build the "Commit Sync Updates" function that executes the selected `SyncDiff` objects and clears the queue.

## 4. UI: Data Locking (Verified Fields)

-[x] 4.1 Add a lock/unlock toggle icon next to editable fields in the Competitor Details view (e.g., Target Audience, Tech Stack).
-[x] 4.2 When toggled, update the entity's `verifiedFields` mapping.
-[x] 4.3 Visually indicate in the UI when a field is "locked" against automated AI/sync overwrites.

## 5. Comprehensive Testing (Vitest & Playwright)

-[x] 5.1 Implement unit tests for `syncDiffUtils.ts` (verifying diff logic and verified field filtering).
-[x] 5.2 Implement unit tests for the `useSyncQueue` hook (verifying queue operations).
-[x] 5.3 Update `AppSync.test.tsx` integration tests to ensure data sync flows correctly push to the SyncQueue instead of directly mutating state.
-[x] 5.4 Create integration tests for the `SyncReviewModal` (verifying UI interactions, Select All, and Commit callback).
-[x] 5.5 Implement Playwright E2E tests simulating full app flows: locking a field, intercepting a background sync, reviewing diffs, and committing changes.