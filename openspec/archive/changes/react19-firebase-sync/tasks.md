# Tasks

## Phase 1: Audit & Cleanup

- [x] Audit codebase for instances of parallel `getDoc` and `onSnapshot` implementations in the same hook/component.
- [x] Remove redundant `getDoc` calls and standardize on the Snapshot-Only approach.
- [x] Extract any write operations (`setDoc`, `updateDoc`, `addDoc`) out of `onSnapshot` listener callbacks.

## Phase 2: Hook Modernization

- [x] Refactor mutation functions to utilize React 19's `useTransition` (`startTransition`).
- [x] Replace `isLoading` boolean flags with explicit state machines (`STATE_IDLE`, `STATE_MUTATING`) in return signatures.
- [x] Ensure all `onSnapshot` listeners are configured with `{ includeMetadataChanges: true }`.
- [x] Implement `AbortController` inside `useEffect` blocks tied to workspace/tenant dependency arrays.
- [x] Replace improper offline-breaking `runTransaction` usages with `setDoc(..., {merge: true})` for standard decoupled writes.

## Phase 3: Auth & UI Edge Cases

- [x] Implement the `isMergingRef` state freeze logic in the core Auth listener to prevent anonymous-to-permanent linking crashes.
- [x] Wrap observable listeners in `try/catch/finally` blocks with a 5-second circuit breaker timeout per NicheAI rules.
- [x] Replace generic loading spinners with Explainable States utilizing `aria-live="polite"` alongside `STATE_MUTATING`.

## Phase 4: Testing Constraints Setup

- [x] Update Vitest global teardown to explicitly terminate `globalThis.firestoreInstance` to prevent memory leaks.
- [x] Refactor React component tests utilizing `<Suspense>` or `use()` to wrap initial renders in `await act(async () => { ... })`. (Already implemented in TrustBuilderScreen.test.tsx)
- [x] Ensure Playwright E2E configurations use `?mock_auth=true&role=user` to bypass race conditions in automated tests. (Already implemented in E2E tests)
