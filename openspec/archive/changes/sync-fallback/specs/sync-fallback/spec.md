# Spec: Synchronous Fallback

## Detailed Features

1. **Synchronous Extraction Pipeline**: Intercepts unseeded niche queries and routes them to Exa for search, then Gemini Flash for extraction, before returning the result to the client.
2. **Circuit Breaker Mechanism**: Tracks failures and execution times. Exposes a state (OPEN, CLOSED, HALF_OPEN) based on failure thresholds and time windows.
3. **Graceful UI Degradation**: When the circuit breaker is OPEN, the API immediately returns a specific fallback response, prompting the UI to show a degraded state (e.g., "Live extraction temporarily unavailable, queued for batch processing").

## Scenarios

**Scenario 1: Successful unseeded extraction**

- **WHEN** a user requests an unseeded hyper-niche
- **THEN** the system routes the request via the sync fallback (Exa -> Gemini Flash)
- **AND** returns the extracted data within the 10-second timeout.

**Scenario 2: API Timeout**

- **WHEN** Exa or Gemini Flash takes longer than 10 seconds to respond
- **THEN** the system aborts the request
- **AND** records a failure in the circuit breaker.

**Scenario 3: Circuit Breaker Trips**

- **WHEN** Exa fails (or times out) 3 consecutive times within a 5-minute window
- **THEN** the circuit breaker transitions to OPEN
- **AND** subsequent requests immediately return a degraded UI state response without hitting the Exa API.

**Scenario 4: Circuit Breaker Resets**

- **WHEN** the circuit breaker is OPEN and 5 minutes have elapsed
- **THEN** the circuit breaker transitions to HALF-OPEN (or CLOSED) to test the next request
- **AND** resumes synchronous fallback extraction if successful.
