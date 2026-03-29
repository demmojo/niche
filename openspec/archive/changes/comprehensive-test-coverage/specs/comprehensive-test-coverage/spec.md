# Comprehensive Test Coverage

To guarantee platform resilience, NicheAI is adopting near-100% intent-based testing for all user flows and features.

## Features

### 1. Server Components and Logic

- **Requirement:** Increase coverage for `server/LLMPenaltyBox.ts`, `server/llmRoutes.ts`, `server/scoringRoutes.ts`, `server/telemetryRoutes.ts`, `server/routes/telemetryRoutes.ts`, `server/sse.ts`, `server/queues.ts`, and `server/rateLimit.ts` via `supertest` and isolated mocking.

### 2. Services and Utilities

- **Requirement:** Increase coverage for `services/tarpitFlywheel.ts`, `utils/mathUtils.ts`, `utils/telemetry.ts`, and `utils/imageUtils.ts` to 100%.

## Scenarios

_Note: Every scenario MUST map 1:1 to an intent-based test using RTL/MSW/Firebase Emulator._

- **WHEN** an authenticated user is rate-limited via `rateLimit.ts`
- **THEN** it rejects the request gracefully with HTTP 429 and accurate headers.

- **WHEN** telemetry is logged through `telemetryRoutes.ts` or `telemetry.ts`
- **THEN** it correctly queues the payload without breaking the UI.

- **WHEN** `LLMPenaltyBox.ts` intercepts a failed or abusive LLM prompt
- **THEN** it correctly penalizes the user account or restricts further operations.

- **WHEN** `sse.ts` connects a client
- **THEN** it maintains the connection, sends heartbeats, and pushes intended messages.

- **WHEN** `queues.ts` adds a job
- **THEN** BullMQ receives the correctly formatted payload.

- **WHEN** the `tarpitFlywheel.ts` runs
- **THEN** it accurately runs its flywheel algorithms and updates the DB state.

- **WHEN** `mathUtils.ts` and `imageUtils.ts` process edge-case inputs
- **THEN** they return correct fallback values and math computations.
