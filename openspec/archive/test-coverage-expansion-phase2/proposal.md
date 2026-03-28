## Why

The project needs to maintain a high standard of reliability and stability. Expanding test coverage globally ensures that critical parts of the application, including hooks, utilities, and core components, behave as expected. Reaching >95% function coverage globally reduces the risk of regressions.

## What Changes

We are introducing new unit and integration tests for various hooks, utility functions, and React components. We are also refining existing tests to resolve `act()` warnings that occur during async rendering or state updates.

## Capabilities

### New Capabilities

- `comprehensive-test-coverage`: Ensures >95% global function coverage.

### Modified Capabilities

- `test-infrastructure`: Enhanced test assertions and warning-free test execution for existing components like `MarketAnalysis` and `UploadDataModal`.

## Impact

This change strictly impacts the `tests` directory and test files alongside components and hooks (e.g., `src/__tests__`). No production code is intended to be changed unless required to make it testable or to fix an uncovered bug.
