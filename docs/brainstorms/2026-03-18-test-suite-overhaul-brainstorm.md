# Test Suite Overhaul Brainstorm
**Date:** 2026-03-18

## What We're Building
A top-tier testing suite that ensures confidence, stability, and high coverage across the NicheAI application. The current suite has a solid foundation (95 unit tests passing) but lacks coverage reporting and suffers from flaky/failing Playwright E2E tests. The objective is to achieve a strict 90% unit test coverage minimum and robust, flake-free E2E tests.

## Why This Approach
We selected **Approach 2: Immediate Overhaul**. 
This approach involves enforcing a 90% coverage threshold in CI immediately, mass-generating unit tests for all currently untested components, and robustly fixing Playwright tests using resilient selectors (like `data-testid`). It prioritizes rapid achievement of a top-tier status without lingering technical debt.

## Key Decisions
- **Unit Testing:** Add `@vitest/coverage-v8`, configure Vitest to enforce exactly 90% coverage across all metrics.
- **E2E Testing:** Existing tests are stable. We will write comprehensive new Playwright E2E tests for other core flows.
- **Visual Regression:** Introduce visual regression testing via Playwright to catch unintended UI changes.
- **Performance:** Optimize test execution time for both unit and E2E suites.
- **Scope:** All components and core utilities must be 90% covered.

## Open Questions
- None. Requirements are clear and validated.

## Next Steps
Proceeding directly to the Deepened Plan phase to research and document the exact implementation details for Vitest and Playwright best practices.
