---
title: "feat: Reverse Demo Hook PLG & Enterprise ML Integration"
type: feat
status: active
date: 2026-03-29
---

# Reverse Demo Hook PLG & Enterprise ML Integration

## Enhancement Summary

**Synthesized on:** 2026-03-29
**Research agents used:** `architecture-strategist`, `framework-docs-researcher`, `best-practices-researcher`, `pattern-recognition-specialist`

### Key Improvements

1. **PQL Compute Gate:** Enforces "Denial of Wallet" protection by breaking the automatic Pro-Tier API chain in the frontend and moving the heavy BullMQ workflow exclusively behind an authenticated account upgrade.
2. **Auth Race Condition Resolution:** Implements a strict "State Freeze" (`isMergingRef`) to prevent React 19's "Snapshot Beats the Fetch" crashes during anonymous-to-permanent account merging.
3. **Firestore Safety:** Replaces the monolithic `runTransaction` with iterative `limit(500)` batching for data reparenting to prevent hard-crashes.
4. **Worker Concurrency Safety:** Mandates strict `FieldPath` partial updates (`.update()`) for BullMQ workers to prevent overwriting backend reparenting transactions.
5. **MSW 202 Async Mocking:** Upgrades intent-based tests to handle the HTTP 202 Accepted pattern natively using floating promises against the local Firebase Emulator.

---

## Overview

This specification resolves critical architectural conflicts between the existing (untracked) "Reverse Demo Hook PLG" UI components and the newly locked "Enterprise ML Orchestration" backend architecture. It securely re-integrates the PLG funnel while protecting the system from Pro-Tier compute bypasses, UI race conditions, and unbounded database transactions.

## Problem Statement / Motivation

The current PLG integration contains several high-risk boundaries:

1. **Pro-Tier Compute Bypass:** `ZeroFrictionEntry.tsx` automatically chains a call to `/api/campaign/start` (which uses the expensive Pro Tier BullMQ workers) right after the initial fast analysis. Anonymous users can drain API credits.
2. **"Snapshot Beats the Fetch" Auth Race Condition:** In `usePQLUpgrade.ts`, `signInWithPopup` succeeds and instantly updates the local `currentUser`. The UI eagerly subscribes to a Firestore document owned by the old anonymous UID, triggering a fatal permission-denied crash before the backend `/merge-anonymous-data` transaction finishes reparenting the document.
3. **BullMQ Worker Overwrite Race:** Background workers writing via `.set()` will overwrite the `userId` back to the anonymous UID during the exact millisecond the backend is reparenting the document.
4. **Unbounded Firestore Transactions:** The backend merge transaction queries all jobs without limits, which will hard-crash if a user exceeds Firestore's 500-write transaction limit.
5. **Missing App Check:** Frontend requests lack the `X-Firebase-AppCheck` header, breaking in production.

## Proposed Solution & Architecture

### Phase 1: Decouple the UI & Enforce Compute Boundaries

- **PQL Interceptor:** Refactor `ZeroFrictionEntry.tsx` to break the automatic API chain. It must only call `/api/scoring/tarpit-analyze` (Lite/Fast Tier) for anonymous users. The flow stops there, presenting a "Generate Full Campaign" button to show the Zero-Shot Value.
- **Wire the PQL Gate:** Clicking the "Generate Full Campaign" button invokes `PQLGateModal.tsx`, mapping the heavy Pro Tier compute exclusively to the account upgrade.
- **App Check Headers:** Create a resilient HTTP client wrapper (`fetchWithAppCheck`) or explicitly attach the `X-Firebase-AppCheck` header to the client fetches.

### Phase 2: Resolve the Race Conditions & Firestore Limits

- **State Freeze (`isMergingRef`):** In `src/hooks/usePQLUpgrade.ts` (or `AuthProvider`), utilize a mutable ref (e.g., `isMergingRef.current = true`) wrapped in a `try/finally` block. This pauses the UI from reacting to the new Google UID until the backend `/merge-anonymous-data` fetch returns 200 OK.
- **Iterative Batching:** In `src/server/authRoutes.ts`, replace the monolithic `runTransaction`. Write a `tombstoneRef` first, then query the collections with `.limit(500)`. Load them into a `WriteBatch` and commit, repeating iteratively (without using `startAfter()`) until all documents are reparented.
- **Strict FieldPaths:** Ensure any ML worker updates strictly use `.update({ progress: X, status: Y })` and never `.set({ merge: true })` to avoid clashing with the reparenting transaction's `userId` changes.

### Phase 3: Restore >80% Test Coverage

- **Mock the 202 Async Pattern:** In MSW handlers, return an `HTTP 202 Accepted` immediately with a fake `jobId`. Simulate the async backend worker using a floating promise (`Promise.resolve().then(...)`) that writes to the local Firebase Emulator, thereby triggering the client's `onSnapshot` listener.
- **Simulate the Race Condition:** Write an intent-based test in `usePQLUpgrade.test.tsx` that pauses the mock BullMQ response, triggers the PQL upgrade flow, and asserts that the data merges successfully without the active UI subscription throwing a permission error.

## Acceptance Criteria

### Functional Requirements

- [ ] `ZeroFrictionEntry.tsx` stops execution after tarpit analysis and displays a "Generate Full Campaign" button.
- [ ] `PQLGateModal.tsx` successfully halts unauthenticated execution of `/api/campaign/start`.
- [ ] `X-Firebase-AppCheck` headers are present on anonymous fetch requests.
- [ ] `usePQLUpgrade.ts` utilizes an `isMergingRef` to prevent UI tearing during account link.
- [ ] `/api/auth/merge-anonymous-data` backend route uses iterative `.limit(500)` batching.

### Quality Gates

- [ ] Intent-based tests in `usePQLUpgrade.test.tsx` complete the full asynchronous lifecycle (mocking the `202` response and emulator snapshot update).
- [ ] Running `npm run test -- --coverage` results in `>80%` global coverage for Lines, Functions, Statements, and Branches.
