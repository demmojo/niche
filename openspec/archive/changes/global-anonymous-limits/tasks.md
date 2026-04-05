# Tasks: Global Anonymous Limits and Token Truncation

## Phase 1: Token Minimization

- [ ] Configure Exa search parameters to use `maxCharacters` limit for anonymous runs.
- [ ] Write a local string slicing utility to guarantee combined text does not exceed 4000 characters.
- [ ] Write unit tests to verify truncation edge cases (e.g., slicing in the middle of a word/JSON payload).

## Phase 2: Global Circuit Breaker Backend

- [ ] Create/Update Firestore schema definitions for `system_limits`.
- [ ] Implement middleware to check `system_limits/anonymous_daily_{YYYY-MM-DD}` prior to LLM invocation.
- [ ] Implement Firestore `FieldValue.increment(1)` using atomic batch or transaction.
- [ ] Enforce the HTTP 429 response when limit is exceeded.

## Phase 3: UI Graceful Degradation

- [ ] Update frontend service handlers to intercept 429 errors.
- [ ] Design and implement a limit-reached dialog state.
- [ ] Add tracking/analytics to measure how many users convert after encountering the global limit state.
