# Spec: Gemini Model Routing

## 1. LocalStorage Migration

**Scenario**: A returning user has legacy models saved in their settings.

- **WHEN** the application initializes and reads `localStorage`
- **AND** the stored model is `gemini-3-flash-preview`
- **THEN** silently migrate the value to `gemini-3.1-flash` without prompting the user.

## 2. Capability-Driven Routing

**Scenario**: Executing a standard task via `aiClient.ts`.

- **WHEN** a task is dispatched with `capability: 'extraction'`
- **THEN** the router selects a model from the Lite Tier (`gemini-3.1-flash-lite-preview`).
- **WHEN** a task is dispatched with `capability: 'reasoning'`
- **THEN** the router selects a model from the Pro Tier (`gemini-3.1-pro-preview`).

## 3. Rate-Limiting and Concurrency

**Scenario**: High-volume extraction bursts.

- **WHEN** an array of extraction tasks is submitted
- **THEN** the request queue limits active concurrent connections to 5-10 using `p-limit`.
- **WHEN** the API returns a `429 Rate Limit` on the `gemini-3.1-flash-lite-preview` model
- **THEN** the client waits using exponential backoff with jitter before retrying.
- **AND** it escalates to `gemini-3.1-flash` only if the maximum retry threshold for the Lite model is exceeded.

## 4. Usage Tracking

**Scenario**: Tracking tokens during interactions.

- **WHEN** a response payload is received from the API
- **THEN** dynamically parse the exact input/output tokens from the API response payload.
- **AND** update an in-memory accumulator.
- **AND** flush the total to `localStorage` via a debounced function to prevent race conditions.
