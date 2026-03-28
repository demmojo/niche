# Design: Gemini Model Upgrade & Dynamic Routing

## Context

Our systems need to adhere to 2026 machine learning best practices for multi-model routing (such as those outlined in Leeropedia), guaranteeing capability-driven model selection and ensuring high reliability during high-volume inference tasks.

## Goals & Non-Goals

**Goals:**

- Transition to the Gemini 3.1 model family.
- Introduce a `Capability` type to inform dynamic routing (`reasoning`, `chat`, `extraction`).
- Provide concurrency controls (`p-limit`) for bulk extractions.
- Establish accurate dynamic token extraction to accurately reflect LLM usage.

**Non-Goals:**

- Supporting arbitrary user-provided model strings outside the curated tiers.
- Integrating an entirely new provider architecture (modifications stay within existing AI client structures).

## Decisions

1. **Capability Flagging**: Adopt `Capability = 'reasoning' | 'chat' | 'extraction'` to define routing. This replaces the binary `tier` configuration.
2. **Rate-Limit Aware Fallbacks**: A 429 rate limit on a Lite model should trigger exponential backoff with jitter on the _same model_ before escalating to higher tiers, preserving cost and latency benefits.
3. **Asynchronous Usage Tracking**: Transition `usageTracker.ts` from synchronous `localStorage` updates to an in-memory accumulator that debounces/flushes periodically.

## Risks & Trade-offs

- **Risk**: Changing model identifier strings will break existing valid sessions stored in user `localStorage`.
  - **Mitigation**: Implement a silent migration hook in `src/components/Settings.tsx` to rewrite `"gemini-3-flash-preview"` to `"gemini-3.1-flash"` on load.
- **Trade-off**: Managing exponential backoffs and concurrency limiters introduces slight complexity to the networking layer, but is strictly required to prevent TCP socket exhaustion and rate-limit penalties.
