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
