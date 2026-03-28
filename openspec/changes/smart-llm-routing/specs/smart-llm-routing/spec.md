# Smart LLM Routing

This feature introduces a default, autonomous "Smart Routing" capability for AI generation. The application will dynamically select the best available "fast" or "pro" model based on the complexity of the current feature, prioritizing user-provided API keys (Claude/OpenAI) over the default Gemini tier.

## Features

### 1. Model Tiers Definition

- **Requirement:** Classify all available models in `src/utils/aiClient.ts` into two arrays: `fastModels` and `proModels`.
  - `fastModels`: `gemini-3-flash-preview`, `gemini-3.1-flash-lite-preview`, `claude-3-5-haiku-20241022`, `gpt-4o-mini`, `gpt-3.5-turbo`.
  - `proModels`: `gemini-3.1-pro-preview`, `claude-3-7-sonnet-20250219`, `claude-3-5-sonnet-20241022`, `claude-3-opus-20240229`, `gpt-4o`, `o1-preview`, `o3-mini`.

### 2. Global Model Override Configuration

- **Requirement:** Refactor the `Settings.tsx` UI to display a single dropdown for "Main AI Model" with the default option being "Auto (Smart Routing)" instead of a multi-select list.
- **Requirement:** Update the storage keys. Introduce `ai_main_model` (string) to replace `ai_selected_models` (array).

### 3. Dynamic Model Fallback Engine

- **Requirement:** Refactor `withModelFallback` in `src/utils/aiClient.ts`. It must accept an options object `config: { tier: 'fast' | 'pro' }` as the second argument, and `timeoutMs` as the third.
- **Requirement:** If `ai_main_model` is `"auto"`, the fallback array (`modelsToTry`) is generated dynamically via `buildFastTierChain()` or `buildProTierChain()`:
  - It filters the requested `tier` (fast or pro) to only include models for which the user has configured an API key.
  - It prioritizes Anthropic/OpenAI models if a custom key is provided, falling back to Gemini models as a last resort (since Gemini has a default `.env` key).
  - It **must strictly enforce Parity Matching**: fallbacks only happen within the same tier to prevent hallucinations.
- **Requirement:** If `ai_main_model` is a specific model string (e.g., `claude-3-7-sonnet-20250219`), the fallback array is simply `[ai_main_model]`, ignoring the requested `tier`.
- **Requirement:** Ensure lazy key validation: the system catches `401 Unauthorized`, `429 Too Many Requests`, and `5xx Server Error` to trigger the fallback, but fails fast (throws) on `400 Bad Request` schema errors.

### 4. Apply Tiers to Application Flows

- **Requirement:** Update all invocations of `withModelFallback` across the application to specify a tier.
  - Examples of `fast`: Domain discovery, entity extraction, data point extraction, SWOT summaries, feature consolidation formatting.
  - Examples of `pro`: Strategic insight generation, document PRD export, user story generation, deep chat reasoning, competitor synthesis.

## Scenarios

- **WHEN** the user has selected "Auto (Smart Routing)" in settings and has configured an Anthropic API Key,
- **AND** a "fast" flow is triggered (e.g., domain extraction),
- **THEN** the system should prioritize `claude-3-5-haiku-20241022` over `gemini-3-flash-preview`.

- **WHEN** the user has selected "Auto (Smart Routing)" and has no custom keys configured,
- **AND** a "pro" flow is triggered (e.g., competitor synthesis),
- **THEN** the system should route the request to `gemini-3.1-pro-preview` using the default `.env` key.

- **WHEN** the user selects a specific "Main Model" in Settings (e.g., `gpt-4o`),
- **THEN** every single flow (fast or pro) is routed exclusively to `gpt-4o`.
