## Context
NicheAI currently leverages `GoogleGenAI` directly. However, users want to utilize OpenAI and Anthropic models, and more importantly, they need a fallback mechanism if their primary model hits rate limits or experiences downtime. We need a unified client that can dynamically fetch models from these providers using the user's BYOK (Bring Your Own Key) setup.

## Goals / Non-Goals

**Goals:**
- Provide a unified `aiClient.ts` that handles Gemini, OpenAI, and Anthropic seamlessly.
- Allow users to input their own API keys for OpenAI and Anthropic.
- Fetch available models dynamically when a valid key is provided.
- Allow the user to select up to 3 models in priority order (Primary, Fallback 1, Fallback 2).
- Automatically try Fallback 1 if the Primary model fails (e.g., 429 Rate Limit, 500 Server Error), and then Fallback 2.

**Non-Goals:**
- Implementing our own backend proxy for OpenAI/Anthropic (it will be entirely client-side BYOK like Gemini).
- Implementing streaming logic if it is too complex across three different SDKs immediately (we can rely on standard JSON response schemas for now, which is what `App.tsx` mostly uses).

## Decisions

**1. Unified AI Client Wrapper**
- **Decision**: We will create `src/utils/aiClient.ts` that exposes a `generateContent` method mirroring the current Gemini structure, but internally routes to the correct SDK (Gemini, OpenAI, or Anthropic) based on the current model's prefix or configuration.
- **Rationale**: This minimizes refactoring in `App.tsx`. We can translate the system prompt and JSON schema requirements into the respective formats for OpenAI and Anthropic.

**2. Dynamic Model Fetching**
- **Decision**: When a user inputs an OpenAI or Anthropic key in Settings, we will fetch the `/v1/models` endpoint for OpenAI and Anthropic's model list.
- **Rationale**: Hardcoding models is brittle. Fetching them ensures users have access to the latest fine-tunes or specialized models their API key allows.

**3. Fallback Logic**
- **Decision**: The `withKeyRotation` wrapper in `geminiClient.ts` will be replaced or upgraded to `withModelFallback` in the new `aiClient.ts`. It will iterate through an array of `[Primary, Fallback 1, Fallback 2]`. If a `catch` block executes, it moves to the next model.
- **Rationale**: Ensures maximum uptime for data syncing and intelligence gathering.

## Risks / Trade-offs

- **Risk: Different JSON Schema capabilities.** -> OpenAI supports Structured Outputs natively, Gemini supports `responseSchema`, and Anthropic handles JSON best with strong system prompting and pre-filling the response with `{`.
- **Mitigation**: The wrapper must standardize the prompt and schema handling. For Anthropic, we may need to inject the schema into the system prompt. For OpenAI, we can use `response_format: { type: "json_object" }`.