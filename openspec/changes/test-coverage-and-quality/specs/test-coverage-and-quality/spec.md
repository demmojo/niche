# Specification: Test Scenarios

## 1. UI Intent-Based Testing (`ComputeMeter`, `TarpitWarningModal`)

- **Scenario: Disabled states based on credits**
  - WHEN a user's credit balance is 0
  - THEN the `ComputeMeter` component renders its interactive elements as disabled (verified via `getByRole`)
- **Scenario: Async React 19 State Transitions**
  - WHEN an async transition is triggered in the `TarpitWarningModal`
  - THEN the modal state updates without triggering React `act()` warnings in the test runner
- **Scenario: Network interception with MSW**
  - WHEN the component fetches data
  - THEN MSW intercepts the request and responds, correctly binding to the `AbortSignal` to prevent memory leaks on teardown

## 2. Hooks & Utilities (`useActionCredits`, `useSafeAITask`, `scoringEngine`)

- **Scenario: Safe AI Task Queuing**
  - WHEN `useSafeAITask` initiates a task
  - AND MSW returns a `202 Accepted { jobId: '123' }`
  - THEN the hook relies on the mock Firebase `onSnapshot` event to transition into a success state
- **Scenario: Scoring Engine Math Boundaries**
  - WHEN the scoring engine is fed an asymmetric array or encounters a divide-by-zero condition
  - THEN it gracefully handles the boundary without throwing an unhandled exception
  - AND absolute latency benchmark assertions execute in `< 1ms` in the `scoringEngine.bench.ts` file

## 3. Backend Routes & Integration (`campaignRoutes`, `credits`)

- **Scenario: TOCTOU and Concurrency on Credit Deduction**
  - WHEN two simultaneous Supertest requests attempt to deduct credits from the same user account
  - THEN the Firebase `runTransaction` block successfully serializes the requests
  - AND only one request succeeds if there is only enough credit for a single action
- **Scenario: Prompt Injection and Zod Validation**
  - WHEN a malicious payload containing HTML tags or failing Zod's `discriminatedUnion` is sent to the campaign route
  - THEN the endpoint aggressively sanitizes the inputs or rejects the request with a `400 Bad Request`
- **Scenario: Express 5.x Payload Limits**
  - WHEN a payload exceeds the configured maximum size
  - THEN Express 5.x rejects the request with a `413 Payload Too Large` error status code

## 4. Coverage and Quality Measurement

- **Scenario: V8 Coverage Validation**
  - WHEN `npx vitest run --coverage` is executed
  - THEN the overall coverage exceeds 95% and targeted core files reach 100%
  - AND no open handles remain hanging (validated via `--hanging-process`)
- **Scenario: Stryker Mutation Testing**
  - WHEN Stryker Mutator runs against the isolated unit test suite
  - THEN the mutation score for the core files exceeds 80%
  - AND surviving mutants are accurately reported for developer review
