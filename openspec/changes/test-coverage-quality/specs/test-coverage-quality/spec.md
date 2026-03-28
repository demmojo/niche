# Specification: Test Scenarios & Metrics

## Detailed Features

### 1. Intent-Based UI Testing

- Wrapper components inject necessary contexts. Tests interact using strict RTL query priority (`getByRole` → `getByLabelText`).
- Explicit testing of React 19 `useTransition` to prevent `act` warnings during async UI updates.

### 2. Hooks & Utilities

- Narrow scope for fake timers: `vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval', 'Date'] })`.
- Scoring engine math constraints (divide-by-zero, asymmetric arrays, V8 cmov optimizations) verified via unit tests.
- Absolute latency constraints (< 1ms) tracked in dedicated `scoringEngine.bench.ts` Vitest files.

### 3. Backend & Express 5 Integration

- Supertest targeting the exported Express app.
- Fast database reset between tests using the Firebase Local Emulator REST API (`DELETE /emulator/v1/projects/...`).

## Scenarios

### Scenario: UI Intent-Based Rendering

- **WHEN** the `ComputeMeter` component is rendered with insufficient credits
- **THEN** it correctly displays a disabled state, applying corresponding accessibility attributes via `getByRole` assertions.

### Scenario: Decoupled Async AI Tasks (`useSafeAITask`)

- **WHEN** an AI task is initiated by the hook
- **THEN** MSW intercepts the request returning `202 Accepted { jobId: '123' }` immediately.
- **AND THEN** a mock Firebase `onSnapshot` event triggers to validate complete decoupled resolution.

### Scenario: Backend TOCTOU Concurrency Prevention

- **WHEN** two simultaneous Supertest requests attempt to deduct action credits on `campaignRoutes.ts`
- **THEN** `runTransaction` effectively serializes the operations.
- **AND THEN** exact balances reflect serial execution without state leakage or race conditions.

### Scenario: Backend Input Sanitization & Payload Constraints

- **WHEN** malicious inputs are provided containing prompt injections (`<`, `>`) or invalid `discriminatedUnion` types via Zod
- **THEN** the API sanitizes the prompt and returns a 400 Bad Request.
- **AND WHEN** the payload exceeds limits
- **THEN** an Express 5.x compliant 413 error status code is strictly returned.
