# Design: Competitor Discovery Review Flow

## Context

The existing deep validation worker (`BullMQ`) blindly discovers competitors via a fallback mechanism if none are provided. This creates a disconnect between the user's intent and the AI's processing target.

## Goals

- Shift competitor discovery from an asynchronous background task to a synchronous pre-flight step.
- Protect cognitive load by using a progressive profiling framework (3-tier).
- Build trust during network latency via staggered, explainable UI states.

## Non-Goals

- Replacing the full deep validation campaign logic.
- Supporting manual entry of complex competitor metadata (focus is on fast AI curation).

## Decisions

- **Heuristic Exa Search**: Use 'Ideal Page' heuristics (e.g., `site:reddit.com` or `site:g2.com` combined with unmet JTBD) instead of raw SEO domains to find deep niche competitors.
- **Hybrid Scoring**: Use Gemini Flash-Lite with structured output (`zodToJsonSchema`) to ensure consistent parsing of the 3-tier results.
- **Graceful Degradation**: Fall back to raw Exa domain names without similarity scores if the LLM extraction fails or rate limits are hit.

## Risks & Trade-offs

- **API Latency**: Combining Exa search and LLM scoring before campaign start delays the final action. _Mitigation_: Implementation of explainable UI loading states ('Querying Exa...', 'Analyzing overlap...').
- **LLM Rate Limits / Failures**: _Mitigation_: Strict requirement to wrap the scoring engine in `withModelFallback` to prevent the UI from hanging.
