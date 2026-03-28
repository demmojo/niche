# Specification: MVP Analytics & Superadmin Operations

## 4-Event Telemetry Pipeline

1. **Activation:** "Competitor Ingestion Completed" (Tracked via backend queues using a `WriteBatch`).
2. **Core Action:** "Market-Driven Sync Commit" (Tracked via `SyncReviewModal` onCommit).
3. **Retention Proxy:** "Lens Agent Evaluated" (Tracked via `LensStrategyConsole` accept/dismiss handlers).
4. **Revenue Signal:** "Compute Upgrade" (Tracked via `saveByokKey` in `byokMiddleware.ts`).

## Telemetry Client Architecture

- **Client:** A React `TelemetryBatcher` class pushing events to an array, flushed on `visibilitychange` or via `requestIdleCallback`.
- **Safety:** PII is sanitized (e.g., `user_manual_override_text` -> `textLength`). Uses `actorType: 'human' | 'agent' | 'system'` derived from `window.__AGENT_SESSION__`.
- **Transport:** HTTP `POST /api/v1/ui-sync`. 400s are silently dropped; rate limit is 30/min; max payload 5kb. Server overrides `userId`, `projectId`, and `serverTimestamp`.

## Superadmin Generative Summary

- Fetched dynamically via `POST /api/telemetry/summary`.
- React 19 Hook `useTransition` allows smooth loading states in `SuperadminAnalytics.tsx` without blocking interactions.
- Response enforces a strict JSON object validated by Zod.

## Scenarios

**Scenario:** Safe User Impersonation

- **WHEN** a Superadmin selects a user and clicks "Impersonate" via Magic Login
- **THEN** the `/api/superadmin/impersonate` endpoint validates the admin, logs to `audit_logs`, and issues a Custom Token with `isImpersonated: true`
- **AND** the client initializes a Secondary Firebase App instance to host this token, displaying a persistent "Exit Impersonation" banner.

**Scenario:** Destructive Action Blocked During Impersonation

- **WHEN** an impersonated session attempts to delete a user's saved project
- **THEN** Firestore Security rules evaluate `!request.auth.token.isImpersonated` as false
- **AND** the request is rejected with `PERMISSION_DENIED`.

**Scenario:** Telemetry Event Batching

- **WHEN** the user dismisses 3 Lens suggestions in rapid succession
- **THEN** the `TelemetryBatcher` queues 3 events with unique UUIDv4 `eventId`s
- **AND** upon browser idle, it flushes the array via a single `POST /api/v1/ui-sync` request.

**Scenario:** LLM Telemetry Summary Hallucination Prevention

- **WHEN** the frontend requests a telemetry summary
- **THEN** the server aggregates the last 24h data, formats it into `<telemetry_data>` XML, and prompts Gemini 3.1 Pro
- **AND** the server validates the output via Zod, ensuring `referenced_metrics` strictly mirror the input XML before returning 200 OK.
