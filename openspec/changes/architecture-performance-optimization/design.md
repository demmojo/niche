## Context

As the app has grown, `App.tsx` has absorbed routing, state, business logic, and presentation. Typing in a chat input triggers a re-render of the entire app. Tests run slowly because Zustand module-level singletons bleed state between test files, forcing isolation.

## Goals / Non-Goals

**Goals:**

- Eliminate cascading re-renders from volatile state.
- Fix Zustand state leakage to speed up CI/local testing.
- Stop UI jank caused by synchronous data serialization.
- Optimize the Vite build chunking strategy.

**Non-Goals:**

- A "big bang" rewrite of the entire application.
- Migrating off Firebase or Zustand.
- Changing the underlying UI design or user features.

## Decisions

**1. Strangler Fig Pattern for App.tsx**

- **Decision**: Progressively extract bottom-defined components (`JsonViewer`, `DataSourceCard`, etc.) into `src/components/`, rather than rewriting the whole file at once.
- **Rationale**: Reduces risk of breaking changes while immediately improving file readability.

**2. Context-Bound Zustand Store**

- **Decision**: Migrate `visualKnowledgeStore.ts` to use `createStore` from `zustand/vanilla` and provide it via React Context.
- **Rationale**: Binds the store lifecycle to the React tree rather than the Node module cache, stopping test state bleeding and allowing the removal of `isolate: true` in Vitest.

**3. Asynchronous State Serialization**

- **Decision**: Move the `JSON.parse(JSON.stringify(newValue))` sanitization logic _inside_ the debounced `setTimeout` in the sync hooks.
- **Rationale**: Deep cloning on the main thread during every React state update drops frames. Deferring it to the network preparation phase eliminates UI jank.

## Risks / Trade-offs

- **Risk: Breaking existing test mocks** -> Refactoring Zustand to Context means tests missing the Provider will fail.
- **Mitigation**: Update `src/setupTests.ts` and test utilities to automatically wrap components in the new `VisualKnowledgeProvider`.
