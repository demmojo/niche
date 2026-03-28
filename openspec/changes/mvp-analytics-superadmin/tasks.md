# Tasks: Implementation Phases

## Phase 1: Foundation (Telemetry Client & API)

- [ ] Create `src/utils/telemetry.ts` (TelemetryBatcher with synchronous queue push, robust `useEffect` cleanup via `dispose()`, and `requestIdleCallback`).
- [ ] Create `src/server/routes/telemetryRoutes.ts` to expose `POST /api/v1/ui-sync`.
- [ ] Implement strict `TelemetryEventSchema` via Zod with `discriminatedUnion('schemaVersion', [...])`.
- [ ] Configure rate-limiting (30/min) and payload size limit (5kb) for `ui-sync` endpoint.
- [ ] Apply Firestore 30-day TTL policy on `telemetry_events` collection.
- [ ] Disable automatic ascending/descending indexing on `timestamp` for `telemetry_events`.

## Phase 2: Instrumentation (The 4 Events)

- [ ] **Event 1 (Activation):** Inject telemetry into BullMQ worker (`src/server/queues.ts`) using a Firestore `WriteBatch`.
- [ ] **Event 2 (Core Action):** Instrument `SyncReviewModal.tsx` via the `onCommit` handler.
- [ ] **Event 3 (Retention Proxy):** Instrument `LensStrategyConsole.tsx` on `handleDismissSuggestion` and accept handler.
- [ ] **Event 4 (Revenue Signal):** Instrument `saveByokKey` in `src/server/byokMiddleware.ts`.

## Phase 3: Superadmin Dashboard Refactor

- [ ] Rip out Recharts and chart rendering logic from `src/components/SuperadminAnalytics.tsx`.
- [ ] Implement backend `POST /api/superadmin/impersonate` route to generate Custom Tokens and append to `audit_logs`.
- [ ] Update Firestore security rules globally to deny destructive changes if `request.auth.token.isImpersonated == true`.
- [ ] Build the "Magic Login" table UI in `SuperadminAnalytics.tsx`.
- [ ] Implement Secondary Firebase App instantiation and context hot-swapping on frontend.
- [ ] Add persistent "Exit Impersonation" banner to clean up the secondary instance.
- [ ] Implement `POST /api/telemetry/summary` endpoint (Aggregate-Validate-Generate pattern using Gemini 3.1 Pro and Zod validation).
- [ ] Integrate LLM Generative Summary UI into the Superadmin dashboard, utilizing React 19 `useTransition` for smooth loading states.
