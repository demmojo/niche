---
title: 100% Test Coverage for Tarpit Tollgate & Core Features
type: chore
status: active
date: 2026-03-27
---

# 100% Test Coverage for Tarpit Tollgate & Core Features

## Overview

Following the "Great Simplification" architecture pivot, we need to drastically improve test coverage, targeting 100% for the newly implemented Tarpit Tollgate, Action Credits economy, and Deep Validation Campaigns. This plan outlines a comprehensive, non-brittle testing strategy combining unit tests, integration tests, security tests, and E2E critical user journeys.

## Problem Statement / Motivation

Recent additions (`campaignRoutes.ts`, `useActionCredits.ts`, `ComputeMeter.tsx`, `TarpitWarningModal.tsx`, `Float32Array` vector math, and the `deductActionCredit` transaction) form the core billing and value proposition of the platform. Lack of coverage here introduces severe risks, including:

1. **TOCTOU Race Conditions:** Users initiating multiple expensive background campaigns before credits are deducted.
2. **Event Loop Starvation:** Unbounded or invalid vector math crashing the Express BFF.
3. **UX Regressions:** The delicate asynchronous polling and "Brutalist Warning" states breaking during future refactors.

## Proposed Solution

Implement a **Boundary Testing Approach** using Vitest, MSW (Mock Service Worker), Supertest, and Playwright. We will avoid brittle tests (mocking internal Firebase Admin chains) and instead test inputs, outputs, database boundaries, and security rules.

## Technical Approach

### Architecture & Tools

1. **Frontend Hooks & Components (React 19 / Vitest + MSW):**
   - Use Mock Service Worker (MSW) to intercept network calls (e.g., `fetch` to `/api/campaign/start`), ensuring `useActionCredits` and `handleGlobalSync` are tested without mocking `fetch` itself.
   - Use `@testing-library/react` to assert DOM states (progress bars, Tarpit Warning modals).
2. **Backend API (Express / Supertest):**
   - Use `supertest` to hit the `campaignRoutes.ts` endpoints ephemerally.
   - Mock Firebase Admin at the module level or run against the Firebase Local Emulator.
3. **Domain Logic (Vector Math):**
   - Pure, deterministic unit tests for `calculateCosineSimilarity` utilizing property-based testing and boundary checks.
4. **End-to-End (Playwright):**
   - Critical user journeys for the full Deep Validation flow.

### Implementation Phases

#### Phase 1: Domain Logic & Security Boundaries

- **Vector Math Tests (`calculateCosineSimilarity`):**
  - **TC-VEC-01:** Orthogonal vectors (expect `0`), Identical vectors (expect `1`).
  - **TC-VEC-02:** Zero-magnitude vectors (divide-by-zero prevention).
  - **TC-VEC-03:** Asymmetric array length injection (ensure graceful failure/rejection).
  - **TC-VEC-04:** Performance benchmark via Vitest `bench` (<1ms for 50x1536 floats).
- **Security & Rate Limits:**
  - **TC-CREDIT-01 (TOCTOU Race Condition):** Test 50 concurrent `POST /api/campaign/start` requests with only 1 credit. Ensure 49 fail with `402 Payment Required`. _(Note: This test will currently fail and requires moving the `deductActionCredit` transaction to the top of the route)._
  - **TC-IDOR-01:** Test unauthorized reads/writes to `campaign_jobs/{id}` for cross-tenant data leakage.

#### Phase 2: Backend API (Express & `p-map` Batching)

- **Campaign Route Setup (`campaignRoutes.test.ts`):**
  - **TC-API-01:** Missing payloads (400 Bad Request).
  - **TC-API-02:** Insufficient credits (402 Payment Required).
  - **TC-API-03:** Success path (202 Accepted, returns `jobId`).
- **Async Batching Reliability (`p-map`):**
  - **TC-BATCH-01:** Fake timers (`vi.useFakeTimers()`) to verify polling and timeouts.
  - **TC-BATCH-02:** Chaos testing - artificially fail 1 of 10 requests in the batch and assert the campaign completes gracefully (`stopOnError: false`).

#### Phase 3: Frontend Hooks & Components

- **`useActionCredits.test.tsx`:**
  - Mock Firestore `onSnapshot` boundary to verify the hook returns the correct credit balance and updates in real-time.
- **`ComputeMeter.test.tsx`:**
  - Render with 50 credits (Green), 5 credits (Orange warning), 0 credits (Red critical).
- **`TarpitWarningModal.test.tsx`:**
  - Render with `isOpen=true`, verify Hard Mode vs Easy Mode logic, click "View Sub-Niches", verify Evolution Diff renders.

#### Phase 4: E2E Critical User Journeys (Playwright)

- **Journey 1:** User clicks "Run Deep Validation Campaign", UI shows loading/polling state, campaign finishes, user sees Brutalist Tarpit Warning.
- **Journey 2:** User clicks "Pivot to Niche (1 Credit)" in the warning modal, verifies credit deduction, and lands on the newly generated idea.

## Acceptance Criteria

### Quality Gates

- [ ] Overall codebase test coverage (Statements/Branches/Functions/Lines) is >= 95%.
- [ ] `src/server/campaignRoutes.ts` has 100% coverage.
- [ ] `src/server/credits.ts` has 100% coverage.
- [ ] `src/components/TarpitWarningModal.tsx` and `ComputeMeter.tsx` have 100% coverage.
- [ ] Vitest runs successfully without hanging on asynchronous timers.
- [ ] TOCTOU race condition in credit deduction is explicitly tested and verified as mitigated.

## Success Metrics

- Vitest Coverage Reporter shows green (>95%) across all newly introduced files.
- CI pipeline executes the suite in under 30 seconds.

## Dependencies & Risks

- **Risk:** Firebase Admin mocking can be extremely brittle.
  - **Mitigation:** Abstract Firebase Admin calls into standard functions (`credits.ts`) and mock the _file_ rather than the deep Firebase Admin prototype chain.
- **Risk:** Node event loop stalling during `Float32Array` tests.
  - **Mitigation:** Apply strict array truncation boundaries (`slice(0, 50)`) before allocation.

## References & Research

- **React 19 Best Practices:** Use standard DOM assertions and avoid deprecated `ReactDOMTestUtils`.
- **Vitest 3 Timers:** Vitest fakes all timing APIs by default; use `vi.advanceTimersByTimeAsync()` to test polling.
- **Security:** Ensure `Float32Array` instantiation is bound by application-layer hard caps to prevent DoS.
