# Test Coverage Expansion Phase 2

This specification outlines the requirements for Phase 2 of the test coverage expansion, targeting >95% global function coverage.

## Features

### 1. Hooks Testing

- **Requirement:** `useOnboarding` must be tested for state initialization, transitions, and completion logic.
- **Requirement:** `useSearchParam` must be tested for reading from and writing to URL parameters, and handling default values.

### 2. Utilities Testing

- **Requirement:** `storage` utility must have comprehensive coverage for setting, getting, removing, and clearing items, handling serialization/deserialization, and dealing with storage limits or availability errors.

### 3. Component Testing

- **Requirement:** `InspiringRadioWidget` must test selection state, onChange callbacks, and accessibility (ARIA roles).
- **Requirement:** `AuthProvider` must test context provision, authentication state changes (login/logout), and edge cases like unauthenticated access.
- **Requirement:** `ProductSwitcher` must test rendering of available products, selection interaction, and active product highlighting.
- **Requirement:** `UploadDataModal` tests must simulate and validate file drag, drop, dragover, and dragleave events correctly.

### 4. Test Health (act warnings)

- **Requirement:** `MarketAnalysis` tests must execute completely without throwing any React `act()` warnings in the console.

## Scenarios

- **WHEN** a developer runs `npm run test:coverage` (or equivalent test coverage command)
- **THEN** the global function coverage metric must report greater than 95%.

- **WHEN** testing the `UploadDataModal` with drag and drop
- **THEN** the mock file should be accepted and the `onDrop` handler called appropriately.

- **WHEN** the `MarketAnalysis` test suite is executed
- **THEN** the console should not output any `Warning: An update to %s inside a test was not wrapped in act(...)`.
