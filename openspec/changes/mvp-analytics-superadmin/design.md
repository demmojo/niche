# Design: MVP Analytics & Superadmin Refactor

## Context

We need to shift from quantitative dashboard building to qualitative, fast-iteration operations. Telemetry must be deterministic and immutable, and the admin interface must directly enable user debugging and strategic overview.

## Goals

- Track exactly 4 key MVP events: Activation, Core Action, Retention Proxy, Revenue Signal.
- Expose "Magic Login" user impersonation with full auditing and safety rails.
- Use LLMs to summarize analytics data in a structured, hallucination-free way.
- Batch UI telemetry cleanly without unmount memory leaks.

## Non-Goals

- Building interactive charts/graphs (PostHog will handle long-term analytics).
- Implementing asynchronous DLQ (Dead Letter Queue) ingestion architecture.
- Slowly Changing Dimensions in telemetry (we are using an append-only event ledger).

## Decisions

- **Secondary Firebase App for Impersonation:** Instead of overwriting the admin's main Firebase Auth token, we will spawn a temporary Firebase app instance on the frontend to hold the impersonated custom token, preserving the root admin session.
- **Aggregate-Validate-Generate Pattern:** For the LLM telemetry summary, backend will aggregate Firestore data, feed it to Gemini 3.1 Pro via `<telemetry_data>` XML, and enforce Zod validation on outputs to ensure cited metrics (`referenced_metrics`) strictly match the input.
- **Idempotency over Queues:** We will drop complex BullMQ/Redis asynchronous pipelines for UI ingestion. Instead, clients will generate UUIDv4 `eventId`s and perform synchronous `.set()` operations on Firestore.
- **No Indexing on Timestamps:** By disabling automatic sorting indexes on `timestamp` in the `telemetry_events` collection, we bypass Firestore's 500 writes/sec limits.

## Risks & Trade-offs

- **Risk:** An impersonated admin might accidentally (or maliciously) trigger a destructive action as the user.
- **Mitigation:** Backend generates a custom token containing `isImpersonated: true` developer claims. Firestore Security Rules will strictly forbid destructive writes (like `allow delete: if ... && !request.auth.token.isImpersonated`). Additionally, all impersonation requests log to `audit_logs`.
- **Risk:** High write volume from telemetry events.
- **Mitigation:** Client-side `TelemetryBatcher` will chunk events, using `requestIdleCallback` and fetching with `keepalive: true` to optimize network transit. A 30-day TTL index will automatically prune old events.
