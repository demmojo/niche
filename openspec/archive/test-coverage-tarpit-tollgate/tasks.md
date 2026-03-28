# Tasks: Test Coverage Implementation

## Phase 1: Domain Logic & Security Boundaries

- [x] Write unit tests for `calculateCosineSimilarity` (TC-VEC-01, TC-VEC-02, TC-VEC-03).
- [x] Add Vitest `bench` for vector math performance to ensure execution <1ms (TC-VEC-04).
- [x] Refactor `campaignRoutes.ts` to move the `deductActionCredit` transaction to the top of the route logic.
- [x] Write TOCTOU concurrency test for 50 requests vs 1 credit in `campaignRoutes.test.ts` (TC-CREDIT-01).
- [x] Write IDOR security tests for cross-tenant leakage on `campaign_jobs/{id}` (TC-IDOR-01).

## Phase 2: Backend API (Express & `p-map` Batching)

- [x] Configure `supertest` for `campaignRoutes.test.ts`.
- [x] Implement missing payload `400 Bad Request` test (TC-API-01).
- [x] Implement insufficient credits `402 Payment Required` test (TC-API-02).
- [x] Implement success path `202 Accepted` test (TC-API-03).
- [x] Implement `vi.useFakeTimers()` tests for async batching polling/timeouts (TC-BATCH-01).
- [x] Implement Chaos testing for `p-map` by artificially rejecting 1 in 10 promises (TC-BATCH-02).

## Phase 3: Frontend Hooks & Components

- [x] Set up MSW for network request boundary interception.
- [x] Write `useActionCredits.test.tsx` using mocked Firestore boundary snapshots.
- [x] Write `ComputeMeter.test.tsx` for Green (50), Orange (5), and Red (0) visual states.
- [x] Write `TarpitWarningModal.test.tsx` testing `isOpen` states, Hard/Easy mode toggles, and click interactions.

## Phase 4: E2E Critical User Journeys (Playwright)

- [x] Implement E2E Journey 1: Run Deep Validation Campaign to Brutalist Warning.
- [x] Implement E2E Journey 2: Pivot to Niche (1 Credit) and verify UI routing and balance changes.
- [x] Validate Test Coverage Reporter shows >95% total, 100% on core files.

## Phase 5: 100% Coverage Expansion & Mutation Testing

- [x] Achieve 100% V8 coverage for `useFirebaseSync.ts` (lines 54-55, 105-106).
- [x] Achieve 100% V8 coverage for `useSafeAITask.ts` (lines 45-46).
- [x] Achieve 100% V8 coverage for `scoringEngine.ts` (lines 125, 143).
- [x] Achieve 100% V8 coverage for `campaignRoutes.ts` (uncovered lines).
- [x] Add `.bench.ts` tests for latency tests.
- [x] Apply test safety best practices (use AbortSignal, V8 hanging process flag, no infinite MSW delays).
- [x] Add Stryker mutation testing and run it successfully for these files.
