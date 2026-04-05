# Design: Global Anonymous Limits and Token Truncation

## Context

The teaser flow is highly engaging but computationally expensive. Unbound scaling of anonymous sessions could drain operational budgets, specifically due to large token inputs from Exa.

## Goals

- Eliminate the risk of budget depletion from unauthenticated viral spikes.
- Restrict token usage per unauthenticated session.
- Introduce zero extra latency in the critical path.

## Non-Goals

- Replacing or duplicating user-level fingerprinting logic.
- Utilizing smaller/cheaper LLMs for text summarization.

## Decisions

- **Atomic Operations**: The global limit must be checked and incremented using Firestore atomic operations (e.g., `FieldValue.increment(1)`) or transactions to prevent race conditions during traffic spikes.
- **Zero-Latency Truncation**: Local string truncation (or relying on Exa's `maxCharacters`) is chosen over LLM summarization. This guarantees zero additional latency, zero hallucination risk, and zero added cost.
- **Graceful Degradation**: The UI will gracefully explain that daily platform limits have been reached and explicitly prompt users to create an account or try again tomorrow.

## Risks/Trade-offs

- _Risk_: A low global threshold (30) might be hit too early in the day, turning away potential sign-ups.
  _Mitigation_: Implement remote config or environment variables to adjust the limit without deploying code.
- _Trade-off_: Truncating web content to 4000 characters may drop vital competitor context.
  _Mitigation_: Prioritize Exa's natively extracted summary if available, falling back to top-k characters.
