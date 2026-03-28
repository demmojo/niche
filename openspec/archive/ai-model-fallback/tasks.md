## 1. Unified AI Client & Fallback Logic
- [x] 1.1 Create `src/utils/aiClient.ts` to encapsulate `GoogleGenAI`, `OpenAI`, and `@anthropic-ai/sdk`.
- [x] 1.2 Implement the `fetchAvailableModels` functions in `aiClient.ts` to dynamically retrieve models from OpenAI and Anthropic when their respective API keys are provided.
- [x] 1.3 Create a unified `generateContent` method in `aiClient.ts` that handles routing prompts and JSON schemas to the correct provider based on the model ID.
- [x] 1.4 Implement `withModelFallback` in `aiClient.ts` to attempt inference using a prioritized list of up to 3 models (Primary, Fallback 1, Fallback 2).

## 2. API Key Management & Settings UI Updates
- [x] 2.1 Update `src/utils/apiKeys.ts` to securely store and retrieve `openai` and `anthropic` keys.
- [x] 2.2 Update `src/utils/usageTracker.ts` to include tracking for OpenAI and Anthropic usage (requests, estimated tokens).
- [x] 2.3 Update `src/components/Settings.tsx` to include input fields for OpenAI and Anthropic API keys.
- [x] 2.4 Add UI in `Settings.tsx` to display fetched models and allow users to select their Primary, Fallback 1, and Fallback 2 models from a combined list.
- [x] 2.5 Update the Quota Dashboard label in `Settings.tsx` to "Real-time Quota Dashboard (Estimated Local Usage)" (fulfilling the previous Task 2.3).

## 3. Rate Limit Modal & Error Handling UI
- [x] 3.1 Create `src/components/RateLimitModal.tsx` specifically for 429 Quota Exceeded errors.
- [x] 3.2 Add a clear explanation and a "Request Higher Limits" button to the modal that directs to the `SupportHelpPage`.
- [x] 3.3 Update `src/App.tsx` catch blocks (for AI, Apollo, and Exa calls) to detect 429 errors and render the `<RateLimitModal />` instead of generic toasts.
- [x] 3.4 Differentiate the error messaging in the modal based on whether the rate limit occurred on a custom BYOK key or the global fallback key.

## 4. App Integration & Testing
- [x] 4.1 Migrate all `GoogleGenAI` and `withKeyRotation` calls in `src/App.tsx` to the new `aiClient` and `withModelFallback`.
- [x] 4.2 Create `src/__tests__/components/RateLimitModal.test.tsx` to verify the modal renders correctly, differentiates key errors, and triggers callbacks.
- [x] 4.3 Run the test suite to ensure no regressions occur.
- [x] 4.4 Mark tasks in `api-usage-limits/tasks.md` and `sync-logging-updates/tasks.md` as complete.