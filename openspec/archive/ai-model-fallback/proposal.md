## Why
Currently, the system is strictly bound to Google's Gemini models for AI inference. If the user hits a rate limit (429), the API is down, or they simply prefer different models like GPT-4o or Claude 3.5 Sonnet, they are blocked. Adding multi-provider support with fallback logic ensures high availability and lets users prioritize up to 3 models across providers (OpenAI, Anthropic, Gemini).

## What Changes
We are introducing a unified AI client that wraps Gemini, OpenAI, and Anthropic SDKs. We will allow users to input their own keys for ChatGPT (OpenAI) and Claude (Anthropic), dynamically fetch available models, and configure a primary model with up to two fallback models.

## Capabilities
### New Capabilities
- `multi-provider-ai-client`: A unified interface abstracting `GoogleGenAI`, `OpenAI`, and `Anthropic` SDKs.
- `model-fallback-strategy`: A retry mechanism that attempts inference using the user's Primary Model, then Fallback 1, and finally Fallback 2 if API errors or rate limits occur.
- `dynamic-model-fetching`: Ability to query the OpenAI and Anthropic APIs (using provided keys) to populate a combined list of available models for the user to select.

### Modified Capabilities
- `byok-integration-manager`: Settings module expanded to support OpenAI and Anthropic keys, as well as a new 3-tier model priority selection UI.
- `api-usage-tracking`: Usage tracker expanded to include token/request estimates for OpenAI and Anthropic.

## Impact
- **`src/utils/aiClient.ts`**: A brand new utility replacing direct `GoogleGenAI` calls across the app (`src/App.tsx`).
- **`src/components/Settings.tsx`**: Significant UI updates to add OpenAI/Anthropic key inputs, a "Fetch Models" capability, and a prioritized list of up to 3 selected models.
- **`src/utils/apiKeys.ts`** and **`src/utils/usageTracker.ts`**: Expanded to handle the new providers.