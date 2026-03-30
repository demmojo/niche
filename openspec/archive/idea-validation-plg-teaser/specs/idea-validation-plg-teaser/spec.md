# Specification

## Detailed Features

- **Downgraded Teaser Stream**: Modifies Exa search and Gemini models to provide cheaper, faster preliminary insights.
- **PQL Gating**: Emits an SSE event to dynamically lock the UI at the most valuable step.
- **State Preservation**: Carries over streamed data into the authenticated session.

## Scenarios

### Scenario 1: Anonymous Teaser Generation

- **WHEN** an anonymous user submits an idea
- **THEN** the backend uses `gemini-3.1-flash-lite-preview` and `exa.search` to stream Competitors, JTBD, and Market Gaps.

### Scenario 2: Hitting the PQL Gate

- **WHEN** the stream reaches the Tarpit Score generation phase
- **THEN** the backend emits a `pql_gate` event and terminates the stream
- **AND** the frontend displays a CTA to "Sign up to unlock your Tarpit Score and Strategy".

### Scenario 3: Usage Limit Reached

- **WHEN** an anonymous user exceeds the 3-teaser limit
- **THEN** the API returns a 429 / PQL limit error and the frontend blocks submission.

### Scenario 4: Converting to Authenticated

- **WHEN** the user clicks the CTA and authenticates via `linkWithPopup`
- **THEN** their account is upgraded and the existing competitor/JTBD React state remains visible.
