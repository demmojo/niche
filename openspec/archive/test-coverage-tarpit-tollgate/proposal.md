# Proposal: 100% Test Coverage for Tarpit Tollgate & Core Features

## Why

Following the "Great Simplification" architecture pivot, core platform functionality relies heavily on the newly implemented Tarpit Tollgate, Action Credits economy, and Deep Validation Campaigns. Without rigorous test coverage, this core billing and value proposition is exposed to severe risks like TOCTOU race conditions, event loop starvation, and asynchronous polling UI regressions.

## What Changes

We will implement a non-brittle, comprehensive Boundary Testing Approach using Vitest, MSW (Mock Service Worker), Supertest, and Playwright. The focus is to hit 100% test coverage on critical business logic (`campaignRoutes.ts`, `useActionCredits.ts`, `ComputeMeter.tsx`, `TarpitWarningModal.tsx`, `Float32Array` operations, and `deductActionCredit` transactions).

## Capabilities

- Strict test guarantees against concurrent TOCTOU vulnerabilities for credit usage.
- Resilient Express endpoints protected against vector math DoS crashes.
- Reliable UI polling and modal states validated dynamically.

## Impact

- > 95% overall codebase test coverage, with exactly 100% on targeted critical paths.
- Guaranteed mitigation of concurrent billing bypass attempts.
- Maintain high developer velocity by keeping the CI suite execution under 30 seconds.
