# Proposal: React 19 Firebase Sync Modernization

## Why

React 19 introduces new primitives for handling asynchronous transitions and form states, reducing reliance on manual `useEffect` chains and state variables. Currently, our Firebase hook implementations suffer from "Snapshot Beats the Fetch" race conditions. This happens when the real-time `onSnapshot` listener fires its initial payload faster than a parallel `getDoc` fetch resolves, leading to clobbered states, unnecessary re-renders, and UI jitter. Furthermore, placing initialization logic (writes) inside `onSnapshot` pollutes the synchronization stream and introduces the risk of Strict Mode SDK poisoning.

## What Changes

1. **Adopt "Snapshot-Only" Approach**: Completely reject parallel `get()` fetches in favor of strictly relying on `onSnapshot` with built-in metadata checks.
2. **Decouple Writes via React 19 Transitions**: Replace tangled initialization writes inside snapshot listeners with atomic writes (`setDoc` with `{merge: true}`) decoupled via `useTransition` and `useOptimistic`.
3. **State Machine Adoption**: Transition from fragile boolean flags (e.g., `isLoading`) to explicit correlation states (`STATE_IDLE`, `STATE_MUTATING`) to synchronize UI behavior.
4. **Auth Crash Prevention**: Introduce an `isMergingRef` "State Freeze" to pause `onAuthStateChanged` UI updates during anonymous-to-permanent account upgrades, preventing `permission-denied` crashes.

## Capabilities

- Native Firebase latency compensation without double-optimism flickering.
- Safe offline persistence for standard mutation workflows.
- Deterministic teardowns using `AbortController` tied to tenant/workspace dependencies.
- Safe operation within React 19 Strict Mode without double-mounting fatal assertions.

## Impact

- **Performance**: Elimination of duplicate initialization reads cuts Firestore read costs and eliminates double-rendering on mount.
- **Stability**: Prevents fatal errors during auth linking and aggressive workspace switching.
- **UX**: Explainable states (`aria-live="polite"`) provide better user trust during asynchronous waits, replacing generic loading spinners.
