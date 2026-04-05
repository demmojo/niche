# Tasks: Synchronous Fallback

## Phase 1: Core Utilities

- [ ] Create `src/utils/circuitBreaker.ts` with in-memory state tracking.
- [ ] Implement failure counting (3 failures) and time window logic (5 minutes).
- [ ] Implement strict 10-second timeout wrappers for async fetch calls.

## Phase 2: Integration & Routing

- [ ] Review existing implementation in `src/server/scoringRoutes.ts`.
- [ ] Hook up the unseeded niche logic to trigger the Exa -> Gemini Flash pipeline.
- [ ] Wrap the Exa and Gemini Flash calls with the 10-second timeout utility.
- [ ] Wrap the Exa call with the Circuit Breaker utility.

## Phase 3: Fallback & UI State

- [ ] Implement fallback return payload when Circuit Breaker is OPEN or a timeout occurs.
- [ ] Update frontend to handle the fallback payload and display the graceful degraded UI state.
- [ ] Add unit tests for `circuitBreaker.ts` (state transitions, timeouts).
- [ ] Test the full pipeline end-to-end with simulated API delays/failures.
