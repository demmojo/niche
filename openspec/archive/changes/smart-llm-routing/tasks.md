## 1. Backend & Utility Modifications

- [x] 1.1 In `src/utils/aiClient.ts`, define two exported arrays for `fastModels` and `proModels` containing the specific model IDs.
- [x] 1.2 Update the `getSelectedModels()` function (or replace it entirely with a robust utility to fetch `ai_main_model` string). Add logic to migrate from the old `ai_selected_models` array to the new string value (defaulting to `"auto"` if undefined).
- [x] 1.3 Refactor the signature of `withModelFallback` from `(operation, timeoutMs)` to `(operation, config: { tier: 'fast' | 'pro' }, timeoutMs?: number)`.
- [x] 1.4 Refactor the fallback engine inside `withModelFallback` to calculate the array of models dynamically based on the requested `tier` (`buildFastTierChain()` or `buildProTierChain()`) if the main model is `"auto"`. Prioritize custom keys (OpenAI/Anthropic) over default `process.env.GEMINI_API_KEY`. If `ai_main_model` is specific, use that as a single-item array.
- [x] 1.5 Ensure lazy key validation: Catch `401`, `429`, and `5xx` errors to trigger fallback, but fail fast (throw error immediately, breaking the loop) on `400 Bad Request` since schema errors will fail across all models.

## 2. Call Site Updates

- [x] 2.1 Update all AI generation calls in `src/App.tsx` (Global Sync flow, market discovery, synthesis, context generation) to use the new `withModelFallback(operation, { tier: '...' })` signature. Apply `fast` to simple extraction tasks (discovery, news analysis pre-processing) and `pro` to synthesis tasks (SWOT, executive summary, feature gaps).
- [x] 2.2 Update `src/components/ConsolidateFeaturesModal.tsx` and `src/components/InsightGeneratorModal.tsx` to explicitly define their required `tier` (mostly `pro` or `fast` formatting).
- [x] 2.3 Update `src/components/InsightBrainstormChat.tsx` and `src/components/MarketAnalysis.tsx` to use `pro` for conversational reasoning.
- [x] 2.4 Update any other AI generators (e.g., `src/components/MyProduct.tsx` for generating User Stories, PRDs) to define their tiers.

## 3. Settings UI Refactor

- [x] 3.1 In `src/components/Settings.tsx`, remove the old "Active AI Models" multi-select UI. Replace it with a single `<select>` dropdown for "Main AI Model".
- [x] 3.2 Ensure the dropdown includes "Auto (Smart Routing)" as the default option at the top. The rest of the options should be dynamically populated by `fetchAvailableModels()`.
- [x] 3.3 Ensure selecting a model correctly saves the single string value to local storage.

## 4. Testing & Verification

- [x] 4.1 Run unit tests and type checks (`npm run typecheck`, `npm run test`) to ensure the signature change didn't break untouched code. Fix any TypeScript errors in test mock files (e.g., `src/__tests__/utils/aiClient.test.ts` or `src/__tests__/AppSync.test.tsx`) that use the old `withModelFallback` signature.
- [x] 4.2 Validate that the `Settings.test.tsx` integration test properly queries the new `<select>` input rather than the old multi-select UI.
