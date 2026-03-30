# Design: React 19 Firebase Sync

## Context

The transition to React 19 allows us to modernize data synchronization. Historical implementations often used a simultaneous `getDoc` and `onSnapshot` on mount, which created a race condition where the fetch could overwrite newer snapshot data. Additionally, Firebase SDK assertions can fatally crash in React 19 Strict Mode if `setDoc` writes are triggered inside `onSnapshot` listeners. Offline behavior has also been fragile when developers mistakenly used `runTransaction` for simple writes, causing immediate failures offline.

## Goals

- Eliminate race conditions between one-off fetches and real-time listeners.
- Separate initialization writes from `onSnapshot` reads to ensure unidirectional data flow.
- Prevent memory leaks and React errors by integrating `AbortController` in all async effects.
- Modernize mutation workflows using React 19 hooks (`useTransition`, `useActionState`, `useOptimistic`).

## Non-Goals

- A complete rewrite of all Firebase interactions (only targeting specific hooks with known race conditions).
- Upgrading the React version itself (assumes React 19 is already available in the workspace).

## Decisions

1. **Removal of redundant `getDoc` alongside `onSnapshot`**: We will rely solely on `onSnapshot`, as it inherently fires an initial read immediately from cache or server. Running `getDoc` concurrently wastes read operations and complicates state updates.
2. **Separation of Writes from Real-time Reads**: Real-time listeners will be pure reads. Initialization will occur in a separate atomic operation. We will rely on Firebase native latency compensation (`hasPendingWrites`) instead of manual `useOptimistic` rollbacks for standard CRUD to avoid "Double Optimism" UI flickering.
3. **Adoption of React 19 Patterns**: Implement `useTransition` and replace manual `const [isLoading, setIsLoading] = useState(false)` boilerplate. Pair explicit transition states with Explainable States (`aria-live="polite"`).
4. **Auth State Freeze**: Implement an `isMergingRef` circuit breaker to pause auth listeners when merging anonymous accounts to permanent ones to prevent fatal permission crashes.

## Risks & Trade-offs

- **Risk**: Decoupling initialization from `onSnapshot` might cause brief flashes of empty state.
  - **Mitigation**: Rely on Firestore's native cache and handle missing documents safely with `setData(null)` to prevent Zombie states.
- **Risk**: `runTransaction` fails completely while offline, instantly crashing React 19 `startTransition`.
  - **Mitigation**: Reserve `runTransaction` strictly for Read-Modify-Write scenarios (e.g., Human-In-The-Loop concurrent merges). Use standard `setDoc(..., {merge: true})` for standard updates to preserve offline queuing.

## Future Potential

- **Optimistic Multi-step Mutations**: Extending the `useOptimistic` pattern to support multi-step "Wizard" flows that can be rolled back instantly if an error occurs.
- **Standardized UI Forms**: Fully integrating `useActionState` into a standardized component library (e.g., `<Form action={...}>`) to eliminate custom loading spinners platform-wide.
