---
title: "feat: Implement 4-Event MVP Analytics and Superadmin Refactor"
type: feat
status: active
date: 2026-03-28
---

# Implement 4-Event MVP Analytics and Superadmin Refactor

## Overview

Implement a highly-focused, lean telemetry strategy for the NicheAI MVP. This strategy measures "Problem Resonance" using a 4-Event model, completely bypassing vanity metrics. Additionally, we are stripping out the over-engineered Recharts visualizations in `SuperadminAnalytics.tsx` to replace them with high-leverage MVP operations: a Magic Login (user impersonation) table and a daily Generative AI summary of our telemetry.

## Problem Statement / Motivation

Founding teams frequently fall into the tarpit of building massive internal analytics dashboards and tracking vanity metrics (page views, session lengths) that don't reflect actual product value. To move fast, we need:

1. A lean, deterministic telemetry pipeline that tracks the 4 core "Aha" moments indicating that a user has escaped a horizontal tarpit and found a niche.
2. A Superadmin view focused purely on qualitative operations (impersonating users to debug their journey) rather than quantitative D3/Recharts dashboards, which should be offloaded to external tools like PostHog/Mixpanel.

## Proposed Solution

1. **4-Event Telemetry Pipeline:**
   - **Activation:** Competitor Ingestion Completed (Tracked via backend queues).
   - **Core Action:** Market-Driven Sync Commit (Tracked via `SyncReviewModal`).
   - **Retention Proxy:** Lens Agent Evaluated (Tracked via `LensStrategyConsole`).
   - **Revenue Signal:** Compute Upgrade (Tracked via `byokMiddleware.ts`).
2. **Telemetry Client & API:**
   - A robust `TelemetryBatcher` class in React utilizing `requestIdleCallback` and `fetch` with `keepalive: true`.
   - A backend `POST /api/v1/ui-sync` endpoint performing synchronous, idempotent `.set()` calls to Firestore with Zod `discriminatedUnion` schema validation.
3. **Superadmin Analytics Refactor:**
   - Rip out Recharts from `src/components/SuperadminAnalytics.tsx`.
   - Replace with a table for "Magic Login" (User Impersonation).
   - Add a plain-text Generative UI section summarizing the 4-event data via an LLM.

## Technical Approach

### Architecture

- **Idempotency:** Client generates `eventId` (UUIDv4) to use with Firestore `.set()`/`.create()` preventing duplicate events on network retries.
- **SCD Type 2 Append-Only Schema:** Leverage `z.discriminatedUnion('schemaVersion', [...])` to future-proof events in the append-only ledger.
- **Agent-Native Safety:** Client enforces an `actorType: 'human' | 'agent' | 'system'` to separate test/AI agent traffic from human founder traffic. Check against a `window.__AGENT_SESSION__` flag.
- **Performance:** Disable automatic ascending/descending indexing on `timestamp` in the Firestore `telemetry_events` collection to bypass the 500 writes/sec limit.
- **Security:** Ensure `POST /api/v1/ui-sync` has rate limiting (e.g., 30/min), payload limits (5kb), and is protected by `requireAuth`. Context values like `userId`, `projectId`, and `serverTimestamp` are strictly overriden by the server.

### Implementation Phases

#### Phase 1: Foundation (Telemetry Client & API)

- Create `src/utils/telemetry.ts` (TelemetryBatcher with synchronous queue push and robust `dispose()` to prevent React unmount memory leaks).
- Create `src/server/routes/telemetryRoutes.ts` to define `POST /api/v1/ui-sync`.
- Implement Zod schema `TelemetryEventSchema`.

#### Phase 2: Instrumentation (The 4 Events)

- **Event 1:** Add telemetry emission to BullMQ worker in `src/server/queues.ts` using Firestore `WriteBatch`.
- **Event 2:** Instrument `SyncReviewModal.tsx` `onCommit` handler.
- **Event 3:** Instrument `LensStrategyConsole.tsx` `handleDismissSuggestion` and accept handlers.
- **Event 4:** Instrument `saveByokKey` in `src/server/byokMiddleware.ts`.

#### Phase 3: Superadmin Dashboard Refactor

- Remove Recharts and chart logic from `src/components/SuperadminAnalytics.tsx`.
- Implement a basic users table with a "Login As" (Impersonate) action.
- Add an LLM summary view that fetches recent telemetry events and prompts Gemini for a strategic summary.

## Alternative Approaches Considered

- **BullMQ / Redis for Telemetry Ingestion:** Rejected due to YAGNI. MVP scale does not require an asynchronous ingestion queue for analytics. Synchronous direct database writes are sufficient.
- **Dead Letter Queue (DLQ) for Failed Telemetry:** Rejected. If validation fails, we `console.warn` and return 400 Bad Request to drop the event.
- **Building Charts in React:** Rejected. Diverts engineering from core product. Route to PostHog for complex queries instead.

## Acceptance Criteria

### Functional Requirements

- [ ] Telemetry events are accurately captured with deterministic UUIDs and strict `schemaVersion`ing.
- [ ] React `TelemetryBatcher` successfully flushes on `visibilitychange` or idle timeout without memory leaks.
- [ ] `actorType` is correctly attributed.
- [ ] Superadmin dashboard no longer contains Recharts, instead rendering a user table and AI summary.

### Non-Functional Requirements

- [ ] `/api/v1/ui-sync` endpoint is rate-limited and context overrides client payload appropriately.
- [ ] PII (like `user_manual_override_text`) is sanitized before telemetry transport (replaced with metadata like `textLength`).

## References & Research

### Internal References

- Brainstorm Document: `docs/brainstorms/2026-03-28-mvp-analytics-brainstorm.md`
- Target Components: `src/components/SuperadminAnalytics.tsx`, `src/components/SyncReviewModal.tsx`, `src/components/lens/LensStrategyConsole.tsx`
- Target Backend: `src/server/queues.ts`, `src/server/byokMiddleware.ts`
