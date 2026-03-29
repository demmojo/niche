# Specification: Reverse Demo Hook PLG

## Detailed Features

### 1. Anonymous Session Management

`AuthProvider.tsx` automatically provisions an anonymous session if no user is found. The UI remains on `ZeroFrictionEntry.tsx` to collect the user's initial idea without blocking.

### 2. Async Orchestration & Pivots

User input is sent to `/api/scoring/tarpit-analyze`. If deemed saturated, the system auto-pivots to a sub-niche. A request is fired to `/api/campaign/start` utilizing the anonymous UID. The API returns `{ jobId }` instantly. The client uses `onSnapshot` to stream generation status into UI "Explainable States".

### 3. The Reverse Demo & Viral Routing

The fully-generated dashboard renders. URL routing supports `/strategy/<campaign_id>`. `firestore.rules` validates read access if `visibility == 'shared'`. Read-only visitors are prompted with a PQL gate to "Fork/Save" the strategy.

### 4. PQL Gate & Secure Account Merge

High-intent UI triggers ("Deploy to GitHub", "Edit Strategy", "Save") intercept the user. The `PQLGateModal` prompts for sign-up. Post-auth, `usePQLUpgrade` initiates a merge via `/api/auth/merge-anonymous-data`. Dual-Token Verification proves ownership, and `runTransaction` reparents `campaign_jobs` and `workspaces` from the old to the new UID.

## Scenarios

**SCENARIO: First-time visitor experiences the core product**

- **WHEN** an unauthenticated user loads the application
- **THEN** Firebase provisions an anonymous auth session in the background
- **AND** the user sees the `ZeroFrictionEntry` prompt instead of an auth wall.

**SCENARIO: Idea Generation provides immediate feedback**

- **WHEN** the user submits an idea
- **THEN** the UI updates optimistically using `useOptimistic`
- **AND** the backend returns a `202 Accepted` with a `jobId`
- **AND** the UI streams Explainable States via `aria-live`.

**SCENARIO: PQL Gate on high-intent action**

- **WHEN** an anonymous user clicks "Deploy to GitHub"
- **THEN** the `PQLGateModal` halts the action and prompts the user to create an account.

**SCENARIO: Secure Data Merging**

- **WHEN** an anonymous user successfully authenticates into a permanent account
- **THEN** the client captures JWTs for both accounts
- **AND** invokes the merge API
- **AND** the backend reparents the Firestore documents to the permanent UID using `runTransaction`.

**SCENARIO: Viral Acquisition Loop**

- **WHEN** an anonymous user copies their strategy URL and shares it with a colleague
- **THEN** the colleague views the dashboard read-only (due to updated Firestore rules)
- **AND** upon clicking any interaction, the colleague is hit with a PQL gate to create their own account.

**SCENARIO: Cost Control Cleanup**

- **WHEN** a scheduled cron job runs
- **THEN** it finds anonymous users and associated data older than 7 days
- **AND** hard deletes the Auth records and the Firestore documents.
