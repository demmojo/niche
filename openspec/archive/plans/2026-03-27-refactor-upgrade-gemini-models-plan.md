---
title: refactor: Upgrade Gemini Models and Implement Dynamic Routing
type: refactor
status: active
date: 2026-03-27
---

# refactor: Upgrade Gemini Models and Implement Dynamic Routing

## Overview

Replace deprecated and older Gemini models (e.g., `gemini-3-flash-preview`) across the codebase with the current 2026 state-of-the-art models (`gemini-3.1-pro-preview`, `gemini-3.1-flash`, and `gemini-3.1-flash-lite-preview`). Simultaneously, implement capability-driven model routing based on machine learning best practices from Leeropedia to ensure the "best model for the job" is dynamically selected based on task complexity, latency requirements, and cost.

## Problem Statement / Motivation

The codebase currently contains hardcoded references to older preview models like `gemini-3-flash-preview` across `src/utils/aiClient.ts`, `src/utils/geminiClient.ts`, and various tests.

Based on 2026 best practices and deprecation schedules:

1. **Risk of API Failure**: Older preview models are subject to sudden shutdowns (e.g., `gemini-3-pro-preview` deprecation). Hardcoding them leads to production outages.
2. **Sub-optimal Performance**: We are not leveraging the specific strengths of the 3.1 model family.
3. **Lack of Dynamic Routing**: Model selection is mostly static. Machine learning best practices dictate that tasks should be routed based on capability (e.g., function calling goes to Pro, bulk data extraction goes to Flash-Lite).

## Proposed Solution

1. **Audit & Replace**: Completely remove `gemini-3-flash-preview` and any other legacy models from the codebase.
2. **Establish the 2026 Model Tiering**:
   - **Lite Tier** (`gemini-3.1-flash-lite-preview`): For high-volume extraction, translation, and structured JSON parsing.
   - **Fast Tier** (`gemini-3.1-flash`): For standard chatbot interactions and balanced speed/reasoning tasks.
   - **Pro Tier** (`gemini-3.1-pro-preview`): For complex problem-solving, advanced data synthesis, and LLM-as-a-Judge evaluations.
3. **Implement Capability-Driven Routing**: Refactor `src/utils/aiClient.ts` to require a capability flag (e.g., `complexity: 'low' | 'medium' | 'high'`) rather than allowing a default model to be blindly used.
4. **Resilient Failovers**: Implement explicit fallback chains (e.g., if `gemini-3.1-pro-preview` rate limits, fall back to `gemini-3.1-flash` if the task permits).

## Technical Considerations

### Architecture Impacts: Capability-Driven Routing Implementation

`src/utils/aiClient.ts` and `src/utils/geminiClient.ts` will need updated type definitions and fallback arrays based on a semantic `Capability` flag (`'reasoning' | 'chat' | 'extraction'`), effectively replacing the old binary `tier: 'fast' | 'pro'` config.
Fallback chains must be built dynamically to respect the **capability floor** (preventing complex reasoning tasks from degrading to lite models) and **safe escalation** (allowing simple tasks to fall upward if rate-limited).

```typescript
// src/utils/aiClient.ts
export type Capability = "reasoning" | "chat" | "extraction";

export const liteModels = [
  "gemini-3.1-flash-lite-preview",
  "gpt-4o-mini",
  "claude-3-5-haiku-20241022",
];
export const fastModels = [
  "gemini-3.1-flash",
  "gpt-4o-mini",
  "claude-3-5-haiku-20241022",
];
export const proModels = [
  "gemini-3.1-pro-preview",
  "claude-3-7-sonnet-20250219",
  "gpt-4o",
];
```

### Performance Implications

- **Concurrency Control for High-Volume Extraction**: The introduction of the `flash-lite` tier will encourage bursts of concurrent extraction requests. We must implement a concurrency limiter (e.g., `p-limit` set to 5-10 concurrent requests) to prevent TCP socket exhaustion and immediate HTTP 429 rate limits.
- **Asynchronous & Batched Usage Tracking**: High-throughput requests will cause UI freezing and data-loss race conditions if `usageTracker.ts` continues to read/write to `localStorage` synchronously on every request. Refactor `trackRequest` to use an in-memory accumulator that debounces/flushes writes to `localStorage` periodically.
- **Rate-Limit Aware Fallback Logic**: In `withModelFallback`, receiving a 429 Rate Limit error on `gemini-3.1-flash-lite-preview` should **not** instantly fall back to a Pro model, as this destroys the cost/latency benefits. Instead, implement exponential backoff + jitter for 429s _on the same model_ before escalating to the next tier.
- **Dynamic Token Extraction**: Replace the static token estimation (`+1500` input / `+500` output) in `usageTracker.ts` with actual token usage metrics parsed directly from the API response payload. High-volume extraction implies highly variable token counts, rendering static estimates dangerously inaccurate.

### Testing

Update all mocked models in `src/__tests__/` to reflect the new 3.1 model family.

## Acceptance Criteria

- [ ] Remove all references to `gemini-3-flash-preview` from `src/utils/aiClient.ts`, `src/utils/geminiClient.ts`, and `src/components/Settings.tsx`.
- [ ] Add `gemini-3.1-flash` to the supported models list.
- [ ] Refactor `getSelectedModels()` and fallback arrays to use the new 3.1 tiering (`pro-preview`, `flash`, `flash-lite-preview`).
- [ ] Update `src/utils/usageTracker.ts` to track usage accurately across the new models.
- [ ] Update all unit and integration tests (e.g., `Settings.test.tsx`, `aiClient.test.ts`) to expect the new model identifiers.

## Success Metrics

- **Zero API Deprecation Errors**: No calls made to sunset models.
- **Cost/Latency Reduction**: Lower average response time for simple extraction tasks by routing them to `flash-lite`.

## Dependencies & Risks

- **Risk**: Changing the model strings might break existing user settings stored in `localStorage`.
- **Mitigation**: Implement a migration step in `src/components/Settings.tsx` or `useLocalStorage` to silently upgrade `"gemini-3-flash-preview"` to `"gemini-3.1-flash"` on load.

## References & Research

- Best Practices (from Leeropedia `user-leeroopedia`):
  - **Capability Validation**: Match tasks exclusively to models proven for that capability (`[Principle/Mlc_ai_Web_llm_Function_Calling_Model_Selection]`).
  - **Explicit Request Routing**: Force the caller to specify the requirement (`[Principle/Mlc_ai_Web_llm_Multi_Model_Routing]`).
  - **Online Model Selection**: Use Bandit-based routing or successive halving for advanced streaming data scenarios (`[Principle/Online_ml_River_Online_Model_Selection]`).

### Security & Privacy

- Validate API payloads when shifting requests from legacy models to newer models to ensure sensitive data constraints are preserved across the multi-model architecture.
