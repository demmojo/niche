# Tasks: Implementation Phases

## Phase 1: Foundation (Telemetry Client & API)

- [x] Create `src/utils/telemetry.ts` (TelemetryBatcher with synchronous queue push, robust `useEffect` cleanup via `dispose()`, and `requestIdleCallback`).
- [x] Create `src/server/routes/telemetryRoutes.ts` to expose `POST /api/v1/ui-sync`.
- [x] Implement strict `TelemetryEventSchema` via Zod with `discriminatedUnion('schemaVersion', [...])`.
- [x] Configure rate-limiting (30/min) and payload size limit (5kb) for `ui-sync` endpoint.
- [x] Apply Firestore 30-day TTL policy on `telemetry_events` collection.
- [x] Disable automatic ascending/descending indexing on `timestamp` for `telemetry_events`.

## Phase 2: Instrumentation (The 4 Events)

- [x] **Event 1 (Activation):** Inject telemetry into BullMQ worker (`src/server/queues.ts`) using a Firestore `WriteBatch`.
- [x] **Event 2 (Core Action):** Instrument `SyncReviewModal.tsx` via the `onCommit` handler.
- [x] **Event 3 (Retention Proxy):** Instrument `LensStrategyConsole.tsx` on `handleDismissSuggestion` and accept handler.
- [x] **Event 4 (Revenue Signal):** Instrument `saveByokKey` in `src/server/byokMiddleware.ts`.

## Phase 3: Superadmin Dashboard Refactor

- [x] Rip out Recharts and chart rendering logic from `src/components/SuperadminAnalytics.tsx`.
- [x] Implement backend `POST /api/superadmin/impersonate` route to generate Custom Tokens and append to `audit_logs`.
- [x] Update Firestore security rules globally to deny destructive changes if `request.auth.token.isImpersonated == true`.
- [x] Build the "Magic Login" table UI in `SuperadminAnalytics.tsx`.
- [x] Implement Secondary Firebase App instantiation and context hot-swapping on frontend.
- [x] Add persistent "Exit Impersonation" banner to clean up the secondary instance.
- [x] Implement `POST /api/telemetry/summary` endpoint (Aggregate-Validate-Generate pattern using Gemini 3.1 Pro and Zod validation).
- [x] Integrate LLM Generative Summary UI into the Superadmin dashboard, utilizing React 19 `useTransition` for smooth loading states.
