# Design: Tarpit Tollgate Test Coverage Strategy

## Context

The application recently introduced core files such as `campaignRoutes.ts`, `useActionCredits.ts`, `ComputeMeter.tsx`, and `TarpitWarningModal.tsx`. These files represent the primary billing mechanisms and complex user flows (Deep Validation).

## Goals

- Achieve >= 95% total test coverage for the specified domains.
- Achieve 100% coverage on `campaignRoutes.ts`, `credits.ts`, `TarpitWarningModal.tsx`, and `ComputeMeter.tsx`.
- Mitigate TOCTOU race conditions explicitly via automated tests.
- Execute the entire test CI suite in under 30 seconds.

## Non-Goals

- Achieving 100% coverage across the entire legacy application.
- Setting up a full E2E Firebase environment (we will use file-level mocking or MSW to prevent brittleness).

## Decisions

- **Boundary Testing:** Use MSW to intercept network calls to ensure React hooks and components are tested functionally without tightly coupling to internal implementation details like `fetch`.
- **API Testing:** Use `supertest` to run against Express endpoints ephemerally.
- **Firebase Mocking:** Abstract Firebase Admin calls into standard functions (`credits.ts`) to avoid deep prototype chain mocking, which is historically brittle.

## Risks & Trade-offs

- **Risk:** Node event loop stalling during `Float32Array` tests crashing the Express BFF.
  - **Mitigation:** Apply strict array truncation boundaries (`slice(0, 50)`) before allocation and verify execution time is <1ms via Vitest `bench`.
- **Risk:** Firebase Admin mocking can break easily with SDK updates.
  - **Mitigation:** Mock at the module boundary (`credits.ts`) instead of the SDK level, or run tests against the Firebase Local Emulator.
