## Why

> **NOTICE:** This spec has been **superseded** by `gemini-model-upgrade-routing`.

Currently, NicheAI users can select a list of AI models that the application cycles through for all tasks. This is suboptimal. Using a slow, expensive "Pro" model (like Gemini 3.1 Pro or Claude 3.7 Sonnet) for simple formatting or extraction tasks wastes tokens and degrades user experience. Conversely, using a fast model for deep strategic synthesis yields poor results. We need an intelligent, automated routing system that selects the best model for the job without burdening the user with granular, per-flow configuration.

## What Changes

We are introducing an "Auto (Smart Routing)" mode as the default behavior. The application code will define whether a specific AI flow requires a `fast` or `pro` model. The system will then automatically route the request to the best available model in that tier based on the user's provided API keys (Gemini, OpenAI, Anthropic).

Users will no longer configure a fallback list of models. Instead, they can set their API keys and choose either the default "Auto" mode or a single "Main Model" to override the smart routing globally.

## Capabilities

### New Capabilities

- `smart-llm-routing`: The system dynamically selects between `fast` (e.g., Gemini 3.0 Flash, Claude 3.5 Haiku) and `pro` (e.g., Gemini 3.1 Pro, Claude 3.7 Sonnet) models based on the specific needs of the current feature.

### Modified Capabilities

- `api-key-management`: The UI in `Settings.tsx` is simplified. Users select a single "Main Model" (which overrides everything) or "Auto (Smart Routing)" instead of a multi-select fallback list.
- `ai-generation`: `withModelFallback` in `src/utils/aiClient.ts` will accept a `{ tier: 'fast' | 'pro' }` configuration object.

## Impact

This impacts `src/utils/aiClient.ts` significantly, simplifying the `withModelFallback` logic while making it smarter. It also impacts the `Settings.tsx` UI and every single invocation of `withModelFallback` across the codebase (which must now be updated to declare its required tier).
