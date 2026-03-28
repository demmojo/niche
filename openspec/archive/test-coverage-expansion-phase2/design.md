## Context

This is the second phase of our test coverage expansion. After Phase 1, we identified specific gaps in coverage regarding custom hooks (`useOnboarding`, `useSearchParam`), utility modules (`storage`), and several components (`InspiringRadioWidget`, `AuthProvider`, `UploadDataModal`, `ProductSwitcher`). We also noticed noisy logs in the `MarketAnalysis` tests due to React `act()` warnings.

## Goals / Non-Goals

**Goals:**

- Achieve >95% global function coverage.
- Write unit tests for `useOnboarding` and `useSearchParam` hooks.
- Write unit tests for `storage` utility.
- Write component tests for `InspiringRadioWidget`, `AuthProvider`, and `ProductSwitcher`.
- Add drag/drop event tests for `UploadDataModal`.
- Resolve all `act()` warnings in `MarketAnalysis` tests.

**Non-Goals:**

- Refactoring production code (unless fundamentally untestable).
- End-to-end (E2E) testing (this phase focuses strictly on unit/integration tests).

## Decisions

**1. Mocking Strategy for Storage**

- **Decision**: Mock `localStorage` and/or `sessionStorage` at the test runner environment level rather than using wrapper utilities.
- **Rationale**: Keeps the test environment closer to the actual browser environment and ensures the `storage` utility is tested against standard Web Storage APIs.
- **Alternatives Considered**:
  - _Dependency Injection_: Pass storage mechanisms into utilities. Rejected as it requires refactoring production code, which is a non-goal.

**2. Handling act() Warnings**

- **Decision**: Use `findBy*` queries or `waitFor` to handle asynchronous state updates in `MarketAnalysis` tests.
- **Rationale**: `act()` warnings typically occur when a component updates state asynchronously after a test has finished or outside of a React testing wrapper. `findBy*` inherently wraps the wait in `act()`.

## Risks / Trade-offs

- **Risk: Flaky Tests** -> Drag and drop events in `UploadDataModal` or async state in `MarketAnalysis` can introduce flakiness.
- **Mitigation**: Use appropriate `testing-library/user-event` APIs and ensure all async boundaries are properly awaited.
