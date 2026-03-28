# Specification: Test Coverage Expansion

## Scenario 1: Unhappy Path UI Rendering

- **GIVEN** the application attempts to fetch campaign data
- **WHEN** the Mock Service Worker (MSW) intercepts the request and returns a 500 error response
- **THEN** the React frontend renders an Explainable Error State
- **AND** the component does not crash or infinite loop

## Scenario 2: Parallel Test Execution with Emulators

- **GIVEN** Vitest is running multiple test suites concurrently
- **WHEN** the test environment initializes Firebase Emulators
- **THEN** a unique project ID (e.g., `demo-nicheai-test-{randomUUID}`) is automatically assigned to the worker pool
- **AND** database queries and mutations do not collide between workers

## Scenario 3: Memory Leak Prevention via Teardown

- **GIVEN** an integration test suite finishes execution
- **WHEN** the global teardown script runs in `src/setupTests.ts`
- **THEN** all isolated database and auth documents are wiped via REST API calls
- **AND** the Firebase app is gracefully terminated and deleted
- **AND** `globalThis.firestoreInstance` is fully deleted to prevent JSDOM memory leaks

## Scenario 4: LLM Stream Parsing Edge Cases

- **GIVEN** `SafeJsonStream.ts` is processing an LLM chunk
- **WHEN** a malformed or partial JSON stream is evaluated
- **THEN** the pure deterministic function parses it safely or fails gracefully without an unhandled exception
- **AND** `fast-check` property tests pass across 100 uniquely generated chaotic variations

## Scenario 5: Unauthorized Firebase Writes & Rules Validation

- **GIVEN** an unauthorized user context attempts a data mutation
- **WHEN** the request hits the Firebase Rules Engine Emulator
- **THEN** the specific `permission-denied` branch is executed in the rules
- **AND** the security test passes by explicitly catching the denial payload
