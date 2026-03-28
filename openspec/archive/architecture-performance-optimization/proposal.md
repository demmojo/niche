## Why

The application suffers from a "God Component" anti-pattern in `src/App.tsx` (over 8,300 lines), leading to massive cascading re-renders, merge conflicts, and unmanageable cognitive load. Furthermore, inefficient state subscriptions, synchronous deep-cloning for Firebase sync, and Vitest state leakage (`isolate: true`) severely degrade both runtime performance and developer experience.

## What Changes

- **Deconstruct Monolith**: Extract heavy subcomponents from `App.tsx` into separate files and push volatile state (like chat inputs) down the component tree.
- **Zustand Context Binding**: Wrap the Zustand store in a React Context to prevent state leakage across tests, allowing the removal of `isolate: true` in Vitest.
- **Serialization Optimization**: Move heavy `JSON.parse(JSON.stringify())` calls into debounced timeouts.
- **Whiteboard Performance**: Implement `useShallow` for granular Zustand subscriptions in `VisualWhiteboard.tsx`.
- **Build Optimization**: Add `manualChunks` to `vite.config.ts` for code splitting.

## Capabilities

### Modified Capabilities

- `runtime-performance`: Drastically reduced main-thread blocking and re-renders on keystrokes/drags.
- `test-execution`: Faster Vitest runs by removing the worker isolation overhead.
- `bundle-delivery`: Faster Time to Interactive (TTI) via code splitting.

## Impact

This affects the root application structure, the `useLocalStorage`/`useFirebaseSync` hooks, the Visual Whiteboard component, the Vitest configuration, and the Vite build configuration.
