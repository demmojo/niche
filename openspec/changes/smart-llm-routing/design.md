## Context

Currently, `withModelFallback` loops through an array of models selected by the user in `Settings.tsx` (via `getSelectedModels()`). This list applies globally to all AI tasks—from lightweight URL extraction to heavy strategic synthesis. This is a common anti-pattern in early AI applications.

By hardcoding the "tier" (fast vs. pro) into the application code at the call site, we ensure optimal performance. A single global override gives power users control without UI clutter.

### Research Insights

**Best Practices:**

- Industry standard uses the "90/10 Rule": ~90% of requests (extraction, summarization, formatting) should use Fast models. Only 10% (complex multi-step reasoning, architectural planning) should use Pro models.
- **Parity Matching (Critical):** Never fallback across tiers. If a "Pro" model fails or rate-limits on a complex reasoning task, falling back to a "Fast" model will almost certainly result in a hallucinated or shallow response. Fallbacks must only happen _within the same tier_ across different providers.

**Performance Considerations:**

- **Sub-1ms Static Routing:** Hardcoding `{ tier: 'fast' }` at the call site in the application code guarantees sub-1ms static routing, avoiding the 300-500ms latency of "LLM-as-a-Judge" dynamic routing.
- **Lazy Key Validation:** Do not ping an API to validate an API key before routing. Assume the key is valid, attempt the request, and catch the `401 Unauthorized` error to trigger the fallback.

**Edge Cases:**

- Differentiate between transient errors (`429 Too Many Requests`, `5xx Server Error`), which are good candidates for fallback to another provider, and hard schema errors (`400 Bad Request`), which will fail on all providers and should not trigger a fallback.

**Implementation Details:**

```typescript
export interface RoutingConfig {
  tier: "fast" | "pro";
}

export const withModelFallback = async <T>(
  operation: (ai: AIClient, model: string) => Promise<T>,
  config: RoutingConfig,
  timeoutMs: number = 120000,
): Promise<T> => {
  const globalOverrideModel = getGlobalOverrideModel();

  let modelsToTry: string[] = [];
  if (globalOverrideModel && globalOverrideModel !== "auto") {
    modelsToTry = [globalOverrideModel];
  } else {
    modelsToTry =
      config.tier === "fast" ? buildFastTierChain() : buildProTierChain();
  }
  // ... execute fallback loop using modelsToTry
};
```

## Goals / Non-Goals

**Goals:**

- Introduce `fast` and `pro` tiers for AI models.
- By default, route simple flows to `fast` models (e.g., Gemini 3.0 Flash Preview, Claude 3.5 Haiku, OpenAI gpt-4o-mini).
- By default, route critical/complex flows to `pro` models (e.g., Gemini 3.1 Pro Preview, Claude 3.7 Sonnet, OpenAI gpt-4o).
- Allow users to set a single "Main Model" globally, overriding the smart routing.
- Simplify the model selection UI in `Settings.tsx` (remove the multi-select fallback list).
- Keep API key inputs available so users can unlock OpenAI and Anthropic models.

**Non-Goals:**

- We are not building a granular per-feature model configuration UI.
- We are not changing the core `generateContent` methods, just the orchestration logic above them.
- We are not handling dynamic cost-routing based on live token prices; we use predefined fast/pro lists.

## Decisions

**1. Model Categorization**

- **Decision**: Create a constant mapping of available models to their respective tiers (`fast` or `pro`).
  - `fast`: `gemini-3-flash-preview`, `gemini-3.1-flash-lite-preview`, `claude-3-5-haiku-20241022`, `gpt-4o-mini`.
  - `pro`: `gemini-3.1-pro-preview`, `claude-3-7-sonnet-20250219`, `claude-3-5-sonnet-20241022`, `claude-3-opus-20240229`, `gpt-4o`.
- **Rationale**: This explicitly defines the capabilities of the models we support.

**2. Auto-Routing Logic in `withModelFallback`**

- **Decision**: Update `withModelFallback(operation, config: { tier: 'fast' | 'pro' }, timeoutMs?: number)` to check the global setting (`ai_main_model`). If it is set to `"auto"` (the new default), the function dynamically constructs an array of models from the requested `tier` based on the user's available API keys.
- **Rationale**: Prioritizes custom keys first (e.g., Claude Pro if Anthropic key is present), then falls back to Gemini models since we have a free `.env` key. Critically, fallbacks must only occur within the same tier (Parity Matching) to avoid hallucinations.

**3. Error Handling and Fail-fast**

- **Decision**: Do not fallback on `400 Bad Request` schema errors. Only fallback on `429 Too Many Requests`, `5xx Server Error`, or `401 Unauthorized` (lazy key validation).
- **Rationale**: Differentiates between transient infrastructure errors and hard logic errors.

**4. Global Override**

- **Decision**: If `ai_main_model` is not `"auto"`, the system ignores the requested `tier` and uses the user's selected "Main Model" for _everything_.
- **Rationale**: Provides power users with an escape hatch if they explicitly prefer one model to rule them all (e.g., "I only trust Claude 3.7 Sonnet").

**4. Update Call Sites**

- **Decision**: Identify all `withModelFallback` calls and assign the appropriate tier. E.g., `Discovering new market entrants` (LLM domain extraction) is `fast`. `Synthesizing competitor profiles` (Strategic analysis) is `pro`.
- **Rationale**: The core of this feature relies on manually auditing each AI flow to determine its complexity.

## Risks / Trade-offs

- **Risk: Breaking existing user configurations.** -> Users currently have `ai_selected_models` (an array).
- **Mitigation**: Add a migration script or just fall back to `"auto"` if `ai_main_model` is missing. We will abandon the `ai_selected_models` array in favor of a single string.
