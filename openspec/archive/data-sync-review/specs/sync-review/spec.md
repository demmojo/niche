## ADDED Requirements

### Requirement: Centralized Sync Queue
The system SHALL intercept automated data pulling, syncing, or generation operations and place their proposed state changes into a global `SyncQueue` rather than applying them instantly.

#### Scenario: Background sync fetches new competitor details
- **WHEN** a background process fetches new Apollo.io or Google Search data for an existing competitor
- **THEN** the system generates a list of `SyncDiff` objects mapping the proposed changes and pushes them to the `SyncQueue`.

### Requirement: Verified Field Protection
The system SHALL allow users to mark specific fields on core entities (like a competitor's `targetAudience` or `coreFeatures`) as "manually verified."

#### Scenario: Syncing over a verified field
- **WHEN** a background sync generates a `SyncDiff` for a field that the user has marked as `verified`
- **THEN** the system automatically flags that diff as "Conflict" and defaults its selection state to unselected, or discards it entirely.

### Requirement: Granular Sync Review
The system SHALL present a "Sync Pending Review" UI that allows users to review, accept, or reject incoming data changes at a granular (field-by-field) level.

#### Scenario: User accepts partial sync results
- **WHEN** a sync proposes updates to a competitor's `fundingHistory` and `techStack`
- **THEN** the user can accept the `fundingHistory` change while rejecting the `techStack` change before clicking "Commit."

### Requirement: Bulk Sync Acceptance
The system SHALL provide "Accept All" and "Reject All" controls to handle large volumes of incoming sync data efficiently.

#### Scenario: User accepts all changes for a specific competitor
- **WHEN** a sync proposes 10 updates across a single competitor's profile
- **THEN** the user can click an "Accept All for this Competitor" checkbox to instantly select all 10 changes for commit.

### Requirement: Sync Blocking
The system SHALL prevent new global syncs from starting if there are unresolved items in the `SyncQueue`.

#### Scenario: User attempts a new sync with pending reviews
- **WHEN** the user clicks "Sync Now" but the `SyncQueue` contains uncommitted diffs
- **THEN** the system prevents the sync and prompts the user to "Resolve pending syncs first."