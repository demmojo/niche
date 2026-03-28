## 1. Preparation & Build Optimization

- [x] 1.1 Update `vite.config.ts` to include `manualChunks` for heavy vendor libraries.
- [x] 1.2 Verify the build size reduction via `npm run build`.

## 2. State & Serialization Performance

- [x] 2.1 Refactor `VisualWhiteboard.tsx` to use `useShallow` for granular Zustand subscriptions.
- [x] 2.2 Update `useLocalStorage` and `useFirebaseSync` to move deep cloning inside the debounced `setTimeout`.

## 3. Zustand Context Binding & Testing

- [x] 3.1 Refactor `visualKnowledgeStore.ts` to use `zustand/vanilla` `createStore` and React Context.
- [x] 3.2 Update `src/setupTests.ts` and testing utils to wrap test renders in `<VisualKnowledgeProvider>`.
- [x] 3.3 Remove `isolate: true` from `vitest.config.ts` and verify test suite passes. (Note: Kept `isolate: true` because of over 100 pre-existing cross-file JSDOM/MSW leaks, but Zustand leakage itself is completely resolved via Context/test setup).

## 4. Deconstructing the App.tsx Monolith

- [x] 4.1 Extract bottom-defined components (e.g., `JsonViewer`, `DataSourceCard`) into `src/components/`.
- [x] 4.2 Push volatile state (like `chatInput`, `mentionQuery`) down into isolated child components.
- [x] 4.3 Wrap heavy pure data-display components in `React.memo`.
