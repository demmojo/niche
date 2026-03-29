# Design: NicheAI UX Strategy

## Context

The current onboarding relies on an empty state that induces decision fatigue. To hit the "Aha!" moment rapidly, we must artificially shrink TTFV using AI pre-population and proven behavioral psychology patterns (Hick's Law, Goal Gradient Effect, Zeigarnik Effect, Labor Illusion). Technically, we must integrate Jobs-To-Be-Done (JTBD) metrics and quantitative market gaps into the existing Server-Sent Events (SSE) streaming architecture, while maintaining latency under 5 minutes and ensuring schema compatibility.

## Goals

- Eliminate the "blank canvas" during Day 1 onboarding.
- Build trust through granular, real-time AI status updates (no generic spinners) via `aria-live="polite"` and deferred promises in React 19.
- Mathematically score market viability using structured JTBD frameworks instead of subjective heuristics.
- Optimize the funnel for Product Qualified Leads (PQL).

## Non-Goals

- Redesigning the core campaign generation engine; focus is strictly on the entry and validation steps.
- Overhauling the core database architecture; changes build on the existing SSE pipelines.

## Decisions

- **Intent-Based Routing**: Force users to select a routing question with 3-5 options upfront. This dynamically prunes irrelevant UI and shapes the system prompt context.
- **Labor Illusion via SSE**: Use `aria-live="polite"` to display the AI's real-time granular updates during data fetching. The BFF Express server will emit two new event types: `{ type: 'jtbd_analysis' }` and `{ type: 'gap_analysis' }`.
- **JTBD Data Model & LLM Parsing**: Expand `LLMExtractionSchema` in `scoringEngine.ts` to require `jtbd` (with `job_statement`, `importance`, and `satisfaction` ints 1-10) and `market_gaps` sub-objects. To prevent JSON parsing errors on partial streams, the BFF will parse the complete AST or utilize safe schema bounds enforced by `zodToJsonSchema`.
- **Latency Mitigation**: The Exa search and Gemini 3.1 Pro generation will remain heavily constrained in token limits. The `numResults` for Exa will be tightly controlled to 3, and text truncation will limit character counts to prevent V8 event loop blocking.
- **Backward Compatibility**: Existing database records lacking `opportunityScore` will gracefully default to 0 during batch reads. The scoring mathematical engine will use `if (input.opportunityScore !== undefined)` to ensure legacy metrics do not throw NaNs.

## Risks & Trade-offs

- **SSE Complexity & Latency**: Forcing the LLM to extract a detailed gap matrix and JTBD scoring increases output token count. If the server waits for the entire AST to close before emitting the `tarpit_score`, we risk violating the "Time-to-Value < 5 mins" rule.
  - _Mitigation_: The LLM system instruction must mandate concise extraction, and the BFF route must handle potential network timeouts using an `AbortController` hooked to the `X-Firebase-AppCheck` headers.
- **LLM Hallucination of Subjective Math**: The LLM may hallucinate the 1-10 `satisfaction` scores.
  - _Mitigation_: The LLM system instruction will require that `satisfaction` scores below 5 be anchored with a corresponding `exact_quote` from negative customer sentiment within the Exa search context.

## Future Potential

- Expand JTBD scoring into a continuous tracking metric for active generated campaigns.
- Implement `generateContentStream` combined with `partial-json` in the BFF to stream individual JSON nodes the moment they close.
