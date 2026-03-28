## Why

Currently, NicheAI automates data gathering through operations like `handleGlobalSync`, `runDiscovery`, and `updateSystemContext`. While powerful, these processes fetch data (e.g., from Apollo.io, Google Search, and Gemini) and indiscriminately overwrite existing application state (e.g., Competitor details like `fundingHistory`, `coreFeatures`, and `techStack`). If a user has manually corrected or verified this data, the sync process will silently erase their work. Providing a granular review process prevents data loss and ensures users trust the AI automation.

## What Changes

Introduce a universal "Data Sync Review" workflow to act as a gatekeeper for all external data pulls and AI-generated state updates, along with comprehensive testing to verify its reliability.

- **Intercept Automated Changes**: Operations that mutate core entities (Competitors, Insights, System Context) will no longer call `setState` directly. Instead, they will propose a `DataDiff` to a global Sync Queue.
- **Granular Review Modal**: After a sync completes, the UI will present a "Sync Pending Review" banner. Users can open a modal to see a field-by-field diff of what changed (e.g., Competitor X's `targetAudience` changed from "SMBs" to "Enterprise").
- **Accept/Reject Controls**: Users can accept changes at a granular level (field-by-field, or competitor-by-competitor) or accept all changes at once.
- **Protect User Data**: Fields that a user has explicitly flagged as "manually verified" (via a new lock/pin UI icon) will automatically reject sync overwrites unless the user forces an override.
- **Comprehensive Testing**: Implement unit, integration, and Playwright E2E tests to ensure sync interceptions, verified field protections, and UI workflows function flawlessly.

## Capabilities

### New Capabilities
- `sync-review`: The workflow, data structures, and UI for intercepting automated state changes, computing diffs, and presenting granular accept/reject controls to the user.

### Modified Capabilities

## Impact

This will require refactoring major automated data flows in `src/App.tsx` (like `handleGlobalSync`, `runDiscovery`, and the feature aggregator) to route through a new `useSyncQueue` hook. We must also update `src/types.ts` to support diffing operations and "verified" status flags on data fields.
