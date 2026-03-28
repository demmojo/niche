# Multi-Provider AI and Fallback Strategy

This specification introduces a multi-provider AI client, allowing users to configure up to three models in priority order across Gemini, OpenAI, and Anthropic. It also handles dynamic fetching of available models when API keys are provided.

## Features

### 1. Multi-Provider BYOK Integration
- **OpenAI and Anthropic Keys:** Extend `src/utils/apiKeys.ts` and `Settings.tsx` to handle `openai` and `anthropic` custom keys securely in `localStorage`.
- **Dynamic Model Fetching:** In Settings, add a mechanism (e.g., a "Fetch Models" button or auto-fetch) that pings the OpenAI and Anthropic APIs to retrieve a list of available models for the user. (For Gemini, the current hardcoded list or a fetch can be used).
- **Priority Selection UI:** A new section in Settings allowing the user to select their:
  - Primary Model
  - Fallback 1 Model
  - Fallback 2 Model
  From a combined dropdown of all available models across the three providers.

### 2. Unified AI Client (`aiClient.ts`)
- **Wrapper Functionality:** Replaces direct `GoogleGenAI` calls in `App.tsx` with a unified `aiClient.generateContent` method that accepts a prompt, system instructions, and a JSON schema.
- **Provider Routing:** Internally, the client determines the provider based on the model ID (e.g., `gpt-4o` -> OpenAI, `claude-3-5-sonnet` -> Anthropic, `gemini-1.5-pro` -> Gemini) and formats the request correctly for the respective SDK/API.
- **JSON Schema Translation:**
  - **OpenAI:** Convert the Gemini schema to JSON Schema for `response_format: { type: "json_schema" }` or inject it into the system prompt.
  - **Anthropic:** Inject the schema into the system prompt and use the messages API, pre-filling the assistant's response with `{` to guarantee JSON output.
  - **Gemini:** Use the existing `responseSchema` configuration.

### 3. Fallback Mechanism
- **Implementation:** Replace `withKeyRotation` with `withModelFallback`. This function attempts the primary model first. If it encounters an error (e.g., 429 Rate Limit, 500 Server Error), it logs the failure and automatically retries with Fallback 1, and then Fallback 2.
- **Error Propagation:** If all configured models fail, it must throw a definitive error that can be caught by the new `RateLimitModal` if it's a 429 issue.

## Scenarios
- **WHEN** a user navigates to Settings and inputs a valid OpenAI API key.
- **THEN** the system fetches the list of available OpenAI models and adds them to the Priority Selection dropdowns.

- **WHEN** the Primary Model (e.g., Gemini 1.5 Pro) fails with a 429 Quota Exceeded error.
- **THEN** the `aiClient` silently logs the failure and immediately retries the exact same prompt with Fallback 1 (e.g., GPT-4o). The system successfully processes the response.

- **WHEN** all three configured models fail (e.g., due to incorrect API keys or severe rate limiting across all providers).
- **THEN** the application catches the final error, displays the new `RateLimitModal` with specific messaging, and halts the operation.