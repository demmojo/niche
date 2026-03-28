# Implementation Tasks

## Phase 1: Configuration & Project Setup

- [x] Scaffold the `test-coverage-expansion` OpenSpec directory and necessary documentation.
- [x] Update `vitest.config.ts` to utilize the `v8` provider.
- [x] Enforce an 80% coverage threshold in `vitest.config.ts` across statements, branches, functions, and lines.

## Phase 2: Firebase Emulator & Teardown Hardening

- [x] Implement strict `NODE_ENV === 'test'` security guards in `test-utils/firebase-setup.ts` to prevent accidental data wipes.
- [x] Refactor Firebase instance setup to generate dynamic test project IDs using `crypto.randomUUID()` or `VITEST_POOL_ID`.
- [x] Configure `initializeFirestore` to use `memoryLocalCache()` to block disk write leakage.
- [x] Implement isolated `afterAll` teardowns combining REST API DELETEs, `terminate()`, `deleteApp()`, and deleting `globalThis.firestoreInstance`.

## Phase 3: Pure Functions & Property Testing

- [x] Refactor LLM parsing inside `src/utils/SafeJsonStream.ts` to function purely deterministically without reliance on side effects.
- [x] Write `fast-check` property tests for `SafeJsonStream.ts`, configuring `{ numRuns: process.env.CI ? 100 : 10 }` to protect execution speed.

## Phase 4: Frontend Intent-Based Testing & Race Condition Fixes

- [x] Setup standard MSW 2.x `HttpResponse` handlers for network edge cases (500 errors, loading states, empty payloads).
- [x] Create React Testing Library (RTL) tests using explicit `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })` to trigger MSW unhappy paths.
- [x] Replace boolean fetch flags with formal State Machines (e.g., `STATE_SNAPSHOT_RECEIVED`) to fix "Snapshot Beats the Fetch" race conditions.
- [x] Ensure strict React 19 `cleanup()` runs before test closures.
- [x] Force `vi.runOnlyPendingTimers()` and `vi.useRealTimers()` in frontend `afterEach` blocks to prevent Vitest 3 + MSW OOM crashes.

## Phase 5: Backend & Security Permissions Testing

- [x] Inject Zod validations (e.g., `CampaignStartSchema.parse`) into all backend routes.
- [x] Write unit tests to intentionally submit malformed payloads, asserting Mass Assignment vulnerability protection.
- [x] Author Firebase Rules Unit Tests specifically targeting `permission-denied` branches for unauthorized mutation logic.
