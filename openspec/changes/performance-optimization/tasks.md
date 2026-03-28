## 1. Foundation & Dependencies

- [ ] 1.1 Remove the phantom dependency `better-sqlite3` from `package.json` to prevent native C++ bloat.
- [ ] 1.2 Install `babel-plugin-react-compiler` and configure it within `vite.config.ts`. Run type-checks to identify and fix any Rules of React violations.
- [ ] 1.3 Audit `vite.config.ts`'s `manualChunks` to ensure they map correctly to the upcoming code-split features.

## 2. Dynamic Asset & SDK Deferral

- [ ] 2.1 Refactor `src/utils/aiClient.ts` to replace static top-level imports of `openai`, `@anthropic-ai/sdk`, and `@google/genai` with dynamic `import()` calls inside function bodies. Cache instances for subsequent calls.
- [ ] 2.2 Identify all `<video>` tags across the application (especially marketing/landing pages like `VisualWhiteboard`, `AnalyticalTemplateSystem`, etc.) and add `preload="none"`.
- [ ] 2.3 Generate and apply lightweight `.jpg` or `.png` `poster` images for each `<video>`.
- [ ] 2.4 Add explicit `<link rel="preload" as="style">` and `crossorigin` attributes for Google Fonts (`Lora`, `Nunito`) in `index.html`.

## 3. Code-Splitting Heavy Features

- [ ] 3.1 Refactor `src/App.tsx` by wrapping the `VisualWhiteboard`, `AnalyticalTemplateSystem`, `LensStrategyConsole`, `InsightQuestModal`, `ConsolidateFeaturesModal`, `DocumentationWizardModal`, and `Settings` imports with `React.lazy()`.
- [ ] 3.2 Ensure these lazy-loaded components are wrapped with `<Suspense fallback={<LoadingSpinner />}>` at their render sites inside the `App.tsx` monolith.
- [ ] 3.3 Verify routing and modal interactions do not cause visually jarring layout shifts during chunk loading.

## 4. Verification & Testing

- [ ] 4.1 Run a local production build (`npm run build`) to verify the initial chunk size has decreased significantly compared to the baseline (~1.5MB unminified).
- [ ] 4.2 Execute the full Vitest suite (`npm run test`) to ensure dynamic AI SDK imports and `Suspense` boundaries have not broken existing functional flows.
- [ ] 4.3 Verify the React Compiler is successfully auto-memoizing the heavy 8,100-line `App.tsx` tree without causing hook or render cycle errors.
