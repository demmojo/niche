# Specification: Competitor Discovery Frontend

## Detailed Features & Scenarios

### Feature: Intercept and Discover Competitors

**Scenario: User triggers campaign without competitors**

- **WHEN** the user initiates `handleGlobalSync` (Run Deep Validation Campaign) and the global `competitors` array is empty
- **THEN** prevent the error toast, set the UI to an explainable loading state ('Discovering competitors...'), and send a `POST` request to `/api/campaign/discover-competitors` with the `baseIdea` (composed of product name and description).

### Feature: HITL Competitor Curation

**Scenario: API successfully returns competitors**

- **WHEN** the discovery endpoint responds with a populated array of competitors
- **THEN** clear the loading state and display the `CompetitorDiscoveryModal` populated with the fetched competitors.

**Scenario: User confirms curated competitors**

- **WHEN** the user reviews the list, optionally makes edits, and clicks 'Confirm'
- **THEN** inject the final list into the global `competitors` state and automatically resume the deep validation campaign logic.

### Feature: Graceful Degradation

**Scenario: API failure or empty results**

- **WHEN** the discovery endpoint returns a 500 error, times out, or returns 0 competitors
- **THEN** clear the loading state and display a fallback prompt instructing the user to manually enter at least one competitor URL to proceed.
