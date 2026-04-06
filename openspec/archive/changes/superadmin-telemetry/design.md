## Context

A runaway LLM loop executing once per second can burn capital instantly. Relying on application-layer `isHalted` flags assumes the rogue worker's event loop is healthy enough to read the flag. Natively pausing the Cloud Task Queue guarantees execution stops. Telemetry metrics must avoid Goodhart's Law by focusing on systemic health rather than gamifiable targets, and UI controls must map explicitly to URLs to assist team coordination during incidents.

## Goals / Non-Goals

**Goals:**

- Native GCP `PauseQueue` for cost velocity and error rates.
- Capped, budget-safe 3-hour AI evaluation for qualitative data health.
- Deeply interruptible workers using `AbortSignal` with atomic state safety.
- Utility-first dashboard surfacing specific NicheAI metrics with full interaction drill-downs.
- O(days) cost-bound dashboard querying via BigQuery rollups.

**Non-Goals:**

- Using LLMs to calculate deterministic metrics like token costs.
- Gamifying qualitative metrics which leads to adversarial LLM behavior.
- Synchronously mutating thousands of documents in a single HTTP request.
- Using generic, whitespace-heavy SaaS date pickers.
- Storing pre-computed ratios in the database (preventing "average of averages" corruption).

## Decisions

**1. Infrastructure-Level Circuit Breaker**

- **Decision**: Trigger native GCP Cloud Tasks `PauseQueue` API.
- **Rationale**: Prevents event-loop starvation where a stuck worker never reads the halt flag.

**2. Sharded Telemetry Counters**

- **Decision**: Use Firestore Distributed (Sharded) Counters for velocity and error tracking.
- **Rationale**: Prevents `DEADLINE_EXCEEDED` crashes caused by Firestore's strict 1-write-per-second limit.

**3. Hierarchical UI & Date Scoping**

- **Decision**: Dashboard uses a tiered layout (AI Efficacy & Safety, Unit Economics). Date scoping uses URL state (`?start=...&end=...`) and Radix UI ToggleGroup `[ 24H ] [ 7D ] [ 30D ] [ ALL ] [ CUSTOM ▾ ]` with dense, tabular-num typography.
- **Rationale**: A metric is only useful if it acts as an entry point to a debugging workflow. URL state enables incident sharing.

**4. Two-Phase Fetch Interaction**

- **Decision**: When changing dates, the dashboard grayscales old data (`opacity-50`, `grayscale`) and displays an indeterminate top-bar loader instead of unmounting or using centered spinners.
- **Rationale**: Maintains context and prevents layout shifts during heavy queries.

**5. Daily Rollups (Numerator/Denominator)**

- **Decision**: Raw events sync to BigQuery. A daily worker writes a single document to `telemetry_daily_rollups` containing only base absolute components (e.g., `tarpit_pivots_total`, `ideation_sessions_total`).
- **Rationale**: Keeps dashboard reads strictly bounded (max 365 reads/year) and guarantees mathematical integrity.

## Risks / Trade-offs

- **Risk: Metric Gaming** -> LLMs might blindly classify everything as a tarpit to boost TPCR, or generate fake citations to boost GER.
- **Mitigation**: The scheduled evaluation includes adversarial spot-checks and the Dashboard provides split-pane drill-downs to allow admins to instantly audit the outputs.
