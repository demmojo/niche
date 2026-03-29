# Implementation Tasks: Reverse Demo Hook PLG

## Phase 1: Zero-Friction Auth & UI

- [x] Update `AuthProvider.tsx` to auto-call `signInAnonymously(auth)` on unauthenticated state.
- [x] Remove hard auth wall (`if (!user) return <AuthScreen />;`) from `App.tsx`.
- [x] Create `ZeroFrictionEntry.tsx` as the new landing state with a single text input.
- [x] Implement `useActionState` and `useOptimistic` within `ZeroFrictionEntry.tsx` to prevent UI flickering during sign-in.

## Phase 2: Async Orchestration & Generation

- [x] Update `/api/scoring/tarpit-analyze` to intercept tarpit ideas and auto-pivot.
- [x] Refactor `/api/campaign/start` to return `202 Accepted` + `jobId` immediately.
- [x] Implement `onSnapshot` listener in UI for `campaign_jobs/{jobId}` to drive Explainable States.
- [x] Enforce Firebase App Check (reCAPTCHA v3) middleware on all generation routes.

## Phase 3: Reverse Demo Dashboard & Viral Loop

- [x] Remove existing PQL gates from `TarpitWarningModal` (allow "VIEW 3 LUCRATIVE SUB-NICHES" for free).
- [x] Update `MyProduct.tsx` to fully render data based on the anonymous UID.
- [x] Make generated dashboard URL-routable (`/strategy/<campaign_id>`).
- [x] Update `firestore.rules` to permit read access if `visibility: 'shared'` or `isPublic: true`.
- [x] Enforce write blocks in `firestore.rules` for unauthenticated or mismatched UIDs.

## Phase 4: PQL Gate & Account Linking

- [x] Create `PQLGateModal.tsx` containing the sign-up prompt.
- [x] Attach `PQLGateModal` check to high-intent actions in `MyProduct.tsx`: "Edit", "Deploy", and "Save".
- [x] Create `usePQLUpgrade.ts` hook utilizing React 19 `useTransition` for smooth modal state.
- [x] Implement LocalStorage backup payload mechanism inside `usePQLUpgrade.ts`.
- [x] Build `/api/auth/merge-anonymous-data` backend route.
- [x] Implement Dual-Token Verification (Anon JWT + Permanent JWT) inside the merge route.
- [x] Implement document reparenting logic in backend using `firestoreInstance.runTransaction`.

## Phase 5: Cost Control & Testing

- [x] Create a scheduled cron job (Cloud Task/GCP Scheduler) script (`src/server/cron.ts`).
- [x] Implement cleanup logic for `campaign_jobs`, `workspaces`, and `admin.auth().deleteUsers()` for anon sessions > 7 days old.
- [x] Write Intent-Based Tests (RTL + MSW) for `usePQLUpgrade.ts` to verify race-condition handling.
- [x] Write Firebase Emulator tests for `/api/auth/merge-anonymous-data` to cryptographically guarantee atomic reparenting.
