# Specification: Global Anonymous Limits and Token Truncation

## Feature: Global Circuit Breaker

### Scenario: System daily limit reached

- **WHEN** an anonymous user attempts to execute the PLG teaser flow
- **AND** the daily global counter (`system_limits/anonymous_daily_{YYYY-MM-DD}`) is >= 30
- **THEN** the backend responds with HTTP 429 Too Many Requests
- **AND** the UI displays a graceful fallback message encouraging account creation.

### Scenario: System daily limit not reached

- **WHEN** an anonymous user attempts to execute the PLG teaser flow
- **AND** the daily global counter is < 30
- **THEN** the backend allows the request
- **AND** atomically increments the counter by 1.

## Feature: Token Minimization

### Scenario: Appending Exa results to prompt for unauthenticated user

- **WHEN** the backend receives Exa search payload containing multiple competitor pages
- **AND** the requester is an anonymous user
- **THEN** the system applies a hard cutoff to the payload string
- **AND** bounds the concatenated text to exactly 4000 characters before sending to the LLM.
