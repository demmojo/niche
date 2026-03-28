# Spec: Competitor Discovery Review Flow

## 1. Triggering the Discovery Flow

**SCENARIO**: User starts campaign without competitors

- **WHEN** the user clicks 'Run Deep Validation Campaign' but `competitors` state is empty
- **THEN** intercept the click and prevent `handleGlobalSync` from firing immediately
- **AND** render an explainable loading overlay ('Scanning for competitors...')
- **AND** make a `POST` request to `/api/campaign/discover-competitors`.

## 2. API Execution

**SCENARIO**: Fetching and Scoring Competitors

- **WHEN** `/api/campaign/discover-competitors` is called with the `baseIdea`
- **THEN** execute an Exa search prioritizing G2 and Reddit discussions
- **AND** pass the domains to a Gemini Flash model to extract JSON matching `{ name, domain, description, similarityScore, matchTier, matchRationale }`
- **AND** return the JSON payload to the client.

## 3. Curation Modal

**SCENARIO**: Reviewing AI Output

- **WHEN** the API returns a successful array of competitors
- **THEN** display the `CompetitorDiscoveryModal` with 3-5 competitor cards
- **AND** show visual indicators for tiers (🔴 Direct, 🟡 Adjacent, 🔵 Legacy)
- **AND** default all cards to 'Keep' but allow the user to toggle them to 'Discard'.

## 4. Handoff & Graceful Degradation

**SCENARIO**: Proceeding to Campaign

- **WHEN** the user clicks 'Confirm & Run Analysis'
- **THEN** inject the 'Kept' competitors into the global state and trigger `handleGlobalSync`.

**SCENARIO**: Handling API Failure

- **WHEN** Exa returns 0 results OR the LLM fails to return valid schema
- **THEN** display a fallback view asking the user to manually enter at least one competitor URL or proceed with broader search.
