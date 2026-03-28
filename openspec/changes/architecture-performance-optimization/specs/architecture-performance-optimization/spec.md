# Architecture & Performance Optimization

## Features

### 1. App.tsx Component Extraction & State Push-Down

- **Requirement:** Volatile state (e.g., `chatInput`, `mentionQuery`) must be moved out of `App.tsx` and into the specific components that use them.
- **Requirement:** Components defined at the bottom of `App.tsx` must be extracted to their own files.

### 2. Context-Bound Zustand

- **Requirement:** `visualKnowledgeStore.ts` must export a vanilla store and a React Context Provider.
- **Requirement:** `vitest.config.ts` must have `isolate: true` removed or disabled.

### 3. Non-Blocking Serialization

- **Requirement:** The `useLocalStorage` / `useFirebaseSync` hooks must not perform deep cloning on the main thread during render cycles. It must be deferred to the debounced sync block.

### 4. Granular Zustand Subscriptions

- **Requirement:** `VisualWhiteboard.tsx` must use `useShallow` from `zustand/react/shallow` to prevent re-renders when unrelated store properties change.

### 5. Vite Build Chunking

- **Requirement:** `vite.config.ts` must implement `manualChunks` to split vendor libraries (`react`, `@xyflow/react`, `recharts`, `firebase`).

## Scenarios

- **WHEN** a user types a single character in the AI chat input
- **THEN** only the chat component re-renders, not the entire application tree.

- **WHEN** a user drags a card on the Visual Whiteboard
- **THEN** ReactFlow handles the drag without the parent component re-rendering, ensuring smooth 60fps performance.
