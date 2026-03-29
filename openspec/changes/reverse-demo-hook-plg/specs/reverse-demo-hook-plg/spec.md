# Specification: Reverse Demo Hook PLG

## Detailed Features

### 1. PQL Compute Gate

The `ZeroFrictionEntry.tsx` component will only execute the fast `/api/scoring/tarpit-analyze` process. Automatic chaining to `/api/campaign/start` will be removed and replaced with a "Generate Full Campaign" CTA that triggers `PQLGateModal.tsx`.

### 2. Firestore Limit & Race Resolution

Account conversion via `/merge-anonymous-data` will utilize an iterative `limit(500)` query. The frontend `usePQLUpgrade.ts` will block Firestore subscription updates during this exact window.

## Scenarios

### Scenario: Anonymous User Triggers Initial Analysis

- **WHEN** an anonymous user initiates the workflow
- **THEN** only the fast analysis runs, and the workflow stops at a CTA button.

### Scenario: Preventing Compute Drain

- **WHEN** an unauthenticated user attempts to generate a full campaign
- **THEN** the `PQLGateModal.tsx` interrupts the process, prompting for account creation/upgrade before hitting BullMQ.

### Scenario: Safe Data Reparenting

- **WHEN** an anonymous user completes the auth upgrade via popup
- **THEN** the UI state freezes (`isMergingRef`), the backend iteratively migrates documents in batches of 500, and the UI unlocks only when the migration is successfully confirmed.

### Scenario: Worker Concurrency

- **WHEN** a background BullMQ worker updates job progress during an auth merge
- **THEN** the worker exclusively uses `.update()` ensuring the newly reparented `userId` is not overwritten.
