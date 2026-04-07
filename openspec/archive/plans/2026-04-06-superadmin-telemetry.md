# Superadmin Telemetry & Intervention Pipeline

## Why

NicheAI processes high-volume market intelligence and taxonomy jobs. As automated agents run, there is a risk of runaway costs and LLM hallucinations degrading data quality. A naive scheduled batch job is insufficient for sudden cost hemorrhages, while human admins need high-signal alerts for qualitative data degradation before intervening.

Based on rigorous architectural review, we must avoid the "Event Loop Starvation" trap of application-layer circuit breakers, the "Quarantine Amplification" cost multiplier, and the "Firestore Counter Implosion" limits. We must also track strategic metrics that measure epistemological quality rather than mechanical volume, and we must store them safely to prevent runaway reads.

## What Changes

We are introducing a Dual-Path Telemetry & Intervention architecture deeply integrated with GCP infrastructure:

1. **Deterministic Fast-Path (Auto-Pause):** Real-time monitoring of error rates and token velocity using **Firestore Distributed Counters (Sharded)**. Breaching hard limits triggers a native GCP Cloud Tasks `PauseQueue` API call.
2. **Qualitative Slow-Path (Scheduled AI Eval):** A 3-hour Cloud Scheduler job that runs a **Capped Sample** to evaluate the dataset's structural and qualitative health using high-signal product metrics.
3. **Historical Rollups (BigQuery to Firestore):** Append-only telemetry is streamed to BigQuery. A daily cron job computes metric denominators and numerators (using strict `_PARTITIONTIME` filters) into a `telemetry_daily_rollups` collection.
4. **Superadmin Intervention Dashboard:** A strict utility-first UI surfacing product-specific telemetry. It organizes metrics hierarchically, provides URL-driven date range selectors using dense typography, and features deep diagnostic workflows.

## Core Metrics

1. **Tarpit Pivot Conversion Rate (TPCR)**
2. **System Override Activation Rate (SOAR)**
3. **Grounded Evidence Ratio (GER)**
4. **Orphaned Pipeline Execution Rate**

## Capabilities

### New Capabilities

- `auto-pause-middleware`: Middleware utilizing Sharded Firestore counters. If thresholds are breached, calls GCP `PauseQueue`.
- `scheduled-ai-eval`: A 3-hour cron job using capped logarithmic sampling to calculate qualitative metrics like GER and SOAR.
- `daily-rollup-worker`: Aggregates base components (numerators/denominators) from BigQuery into Firestore `telemetry_daily_rollups`.
- `superadmin-intervention-dashboard`: Radix UI/Tailwind dashboard with hierarchical architecture, dense URL-driven date picker, Two-Phase Fetch loading states, and deep drill-down interaction states.
- `async-quarantine-worker`: A backend worker that safely chunks document updates strictly under the Firestore 500-batch limit.

## Impact

- **Backend**: Telemetry decoupled from business logic. Workers use strict atomic `runTransaction` boundaries and handle GCP pauses natively.
- **Frontend**: New `SuperadminTelemetryDashboard` component providing deep diagnostic workflows, not generic SaaS cards.
- **Data Integrity**: Bounded queries for historical data (fetching exactly N daily docs instead of millions of events), preventing query timeouts and cost bloat.

---

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

---

# specs/superadmin-telemetry/spec.md

# Superadmin Telemetry & Intervention Pipeline

## Features

### 1. High-Signal Telemetry Metrics & Rollups

- **Requirement**: Calculate **Tarpit Pivot Conversion Rate**, **Grounded Evidence Ratio**, **System Override Activation Rate**, and **Orphaned Pipeline Execution Rate**.
- **Requirement**: Raw telemetry streams to BigQuery. A daily worker aggregates components (numerators/denominators) into `telemetry_daily_rollups` documents. Ratios are computed on the client.

### 2. Deterministic Fast-Path (Auto-Pause)

- **Requirement**: Increment Sharded Firestore counters for token and error velocity decoupled from business data inserts.
- **Requirement**: If thresholds breach, call GCP Cloud Tasks `PauseQueue` API for the specific worker queue.

### 3. Qualitative Slow-Path (AI Evaluation)

- **Requirement**: Cloud Scheduler hits `/api/admin/trigger-eval` every 3 hours.
- **Requirement**: Samples a capped maximum of recent insertions to evaluate for qualitative metrics, generating a HITL alert on degradation.

### 4. Superadmin Dashboard UI

- **Requirement**: Date Control Panel: A `Radix UI ToggleGroup` exposing 24H, 7D, 30D, ALL, and a Custom Popover (using `react-day-picker` stripped of default CSS, applying `tabular-nums` and `text-xs`). Selected ranges sync to the URL immediately on selection (no 'Apply' button).
- **Requirement**: Visual State: Use Two-Phase Fetching (grayscale/opacity filter + top loading bar) during date changes.
- **Requirement**: Interactive Drill-Downs: Clicking GER opens a split-pane modal showing the claim vs external citation to audit for hallucinated links.

## Scenarios

- **WHEN** token velocity exceeds the sharded threshold limit for the `TaxonomyWorker`
- **THEN** the fast-path middleware calls the GCP API to pause the queue natively.

- **WHEN** the Superadmin changes the date range to "30D"
- **THEN** the URL updates instantly, the dashboard dims, and the client queries exactly 30 documents from `telemetry_daily_rollups`, recalculating the TPCR ratio client-side.

- **WHEN** the Superadmin clicks on the GER alert
- **THEN** they see a time-series threshold band and can click a node to open a split-pane comparing the LLM output to the fetched external data.

---

# tasks.md

## 1. Backend / Deterministic Telemetry & Infrastructure

- [ ] 1.1 **Test:** Write failing MSW/Firebase Emulator tests for Sharded Firestore counter logic.
- [ ] 1.2 **Implement:** Create deterministic sharded counter logic and GCP `PauseQueue` API integration.
- [ ] 1.3 **Implement:** Extract and calculate Orphaned Pipeline Execution Rate by diffing dangling jobs.

## 2. Backend / AI Evaluation & Rollups

- [ ] 2.1 **Test:** Write failing intent-based tests for `daily-rollup-worker` (asserting numerator/denominator calculations).
- [ ] 2.2 **Implement:** Set up the BigQuery stream and create the `daily-rollup-worker` to aggregate into `telemetry_daily_rollups`.
- [ ] 2.3 **Implement:** Create `evalWorker.ts` with capped logarithmic sampling to generate qualitative alerts.
- [ ] 2.4 **Implement:** Create `quarantineWorker.ts` with cursor pagination and chunked 499-doc `WriteBatch` operations.

## 3. Frontend / UI Integration

- [ ] 3.1 **Test:** Write failing RTL tests for `SuperadminTelemetryDashboard` date-range URL syncing and Two-Phase Fetching visual states.
- [ ] 3.2 **Implement:** Build the Radix UI ToggleGroup date selector (24H/7D/30D/ALL/CUSTOM) with tabular-num typography and auto-apply behavior.
- [ ] 3.3 **Implement:** Build the core dashboard logic to query `telemetry_daily_rollups` and compute ratios dynamically.
- [ ] 3.4 **Implement:** Build the drill-down split-pane modals for auditing claims vs. evidence.

## 4. Final Phase: Testing & Validation

- [ ] 4.1 Verify targeted local coverage meets the 90-100% threshold.
