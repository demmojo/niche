# Proposal: Upgrade Gemini Models and Implement Dynamic Routing

## Why

The codebase currently relies on deprecated and older Gemini models (e.g., `gemini-3-flash-preview`). Hardcoding these legacy models poses a significant risk of sudden production API failures due to deprecation schedules. Furthermore, the static model selection approach fails to leverage the varied capabilities of the newer Gemini 3.1 model family, resulting in sub-optimal performance and higher costs.

## What Changes

1. **Model Audit & Replacement**: Complete removal of `gemini-3-flash-preview` and other legacy models, replacing them with the current state-of-the-art: `gemini-3.1-pro-preview`, `gemini-3.1-flash`, and `gemini-3.1-flash-lite-preview`.
2. **Dynamic Routing Setup**: Refactoring API clients (`src/utils/aiClient.ts`, `src/utils/geminiClient.ts`) to route tasks based on a semantic capability flag rather than hardcoded defaults.
3. **Resiliency Upgrades**: Implementing exponential backoff, rate-limit awareness, concurrency control, and true token extraction for accurate usage tracking.

## Capabilities

- **Lite Tier**: Optimized for high-volume extraction, translation, and structured JSON parsing.
- **Fast Tier**: Optimized for standard chatbot interactions and balanced speed/reasoning.
- **Pro Tier**: Optimized for complex problem-solving and LLM-as-a-Judge evaluations.
- **Failover Logic**: Explicit fallback chains maintaining capability floors and safe escalation paths.

## Impact

- **Zero API Deprecation Errors**: Proactive migration ensures high availability.
- **Cost/Latency Reduction**: Intelligent routing decreases average response times and API costs for simpler tasks.
- **Improved UI Performance**: Moving usage tracking to batched in-memory mechanisms prevents UI freezing during high-throughput bursts.
