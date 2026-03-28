# ADR 002: Decomposition of App.tsx

## Status

Accepted

## Context

Over time, `src/App.tsx` absorbed multiple domains—routing, business logic, global state, UI presentation, and deep background syncing. This led to a "God Component" structure approaching 8,000 lines. This pattern resulted in high cognitive load, difficult testing, and UI performance bottlenecks where typing in a volatile input (like a chat box) caused the entire application to re-render.

## Decision

We are systematically decomposing `App.tsx` utilizing a Feature-Sliced Design pattern where possible, moving volatile state down the tree.

1. **Extract Sub-Components**: Heavy components previously defined at the bottom of `App.tsx` (e.g., `InsightEngineChat`, `JsonViewer`, `DataSourceCard`) were extracted into `src/components/`.
2. **Push Down Volatile State**: State variables like `chatInput` and `isTyping` were removed from the parent component and instantiated inside the child components that strictly own that logic.
3. **Memoization**: Data-display components were wrapped in `React.memo` to skip diffing if the parent application root re-renders due to a global event.

## Consequences

### Positive

- **Performance**: Keystrokes in chat inputs or drag events no longer trigger root-level updates.
- **Readability**: Reduced `App.tsx` line count significantly. Code boundaries are clearer.
- **Testing**: We can now write isolated unit tests for `InsightEngineChat` without mocking the entire `App` shell.

### Negative

- **Prop Drilling**: In a few places, large configuration arrays (like `competitors` and `derivedInsights`) must be passed down as props to the newly extracted components.
- **Incomplete Decomposition**: `App.tsx` still contains a massive `WorkspaceApp` functional component with ~70 instances of `useState`. This decomposition is an ongoing, progressive effort rather than a "big bang" rewrite.
