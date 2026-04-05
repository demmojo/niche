# Design: Synchronous Fallback

## Context

Currently, unseeded niche searches rely on a Batch API process that can take 24+ hours, resulting in a poor initial user experience. A synchronous fallback allows us to instantly fetch and extract niche data.

## Goals

- Provide immediate extraction data for unseeded niches.
- Ensure system stability when external APIs are slow or failing.
- Provide a graceful UI degradation if the sync fallback is unavailable.

## Non-Goals

- Completely replacing the Batch API (sync is for immediate fallback only).
- Implementing a fully distributed circuit breaker (in-memory is sufficient for now).

## Decisions

- **In-Memory Circuit Breaker**: Distributed state via Redis is deferred. In-memory per node instance is acceptable for the current scale.
- **Failure Thresholds**: Exa circuit breaker trips after 3 consecutive failures within a 5-minute window.
- **Timeout Limits**: Strict 10-second timeouts on Exa and Gemini Flash calls.

## Risks/Trade-offs

- **In-memory state**: In a multi-node environment, an Exa outage might take slightly longer to trip across all nodes because the failure state isn't shared. This trade-off is accepted for implementation speed.
- **Latency**: Even with timeouts, adding sync API calls adds latency to the request. 10 seconds is the maximum tolerated.

## Future Potential

- Upgrade the circuit breaker to use Redis for distributed state sharing across node instances.
- Expand the synchronous fallback to other extraction sources if Exa proves insufficient.
