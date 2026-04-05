---
title: feat: Superadmin Data Quality Dashboard & Pipeline Control
type: feat
status: archived
date: 2026-04-05
---

# feat: Superadmin Data Quality Dashboard & Pipeline Control

## Overview

The Hyper-Scale SaaS Data Moat pipeline currently runs completely headless. While infrastructure metrics (queue depth, error rates) are best handled by native GCP Cloud Monitoring, we need to "dogfood" our own business intelligence. Superadmins currently lack visibility into the **data quality** of the moat—specifically, which domains are failing the `auditWorker` LLM-as-a-Judge rubrics and being quarantined in BigQuery.

Furthermore, superadmins need a way to estimate the pipeline's operational costs and gracefully halt (pause) the pipeline if anomaly rates spike or budgets are threatened, without needing to navigate the GCP Console or execute raw SQL.

This plan outlines the creation of a "Data Quality & Control" tab within the internal NicheAI Superadmin Dashboard. Crucially, it avoids the architectural anti-pattern of synchronous OLAP querying and tightly-coupled infrastructure manipulation (IAM bloat) by leveraging Firestore-backed cron aggregates and a global circuit breaker pattern.

## Problem Frame

- **Blind Data Quality:** The `auditWorker` is actively quarantining domains in BigQuery (`is_active = FALSE`), but product leadership cannot easily review _why_ (the LLM penalty reasoning) without writing raw SQL.
- **Runaway Compute Risks:** If a structural change in the market or a bad prompt causes hallucination spikes, there is no easy "kill switch" in the UI to halt the pipeline and prevent burning AI tokens.
- **The "Vanity Metric / Billing" Infra Trap:** Displaying raw queue depths or integrating directly with the GCP Billing API in a custom React dashboard is massive negative leverage. It requires immense engineering to replicate GCP's native capabilities, effectively becoming an un-actionable "check engine" light and a maintenance tarpit.
- **Synchronous OLAP Anti-Pattern:** Querying BigQuery directly from an Express BFF route on page load will cause severe latency, timeouts, and unnecessary per-query costs.

## Requirements Trace

- R1. **Business Intelligence, Not Infrastructure:** The UI must strictly display data quality metrics (quarantine rates, LLM audit penalty reasons, recent failing domains). It must explicitly exclude raw infrastructure metrics (Cloud Tasks queue depth), which are delegated to GCP Monitoring.
- R2. **Asynchronous State Sync:** The architecture must enforce the "Snapshot Beats the Fetch" philosophy. BigQuery aggregates must be synced to a single Firestore document (`admin_dashboards/data_quality`) periodically.
- R3. **Firestore Circuit Breaker (Pause):** The system must include a global "Pause" functionality. To avoid IAM bloat, this must be implemented as a Firestore state flag (`config/pipeline_state { is_paused: true }`), **not** by using the `@google-cloud/tasks` SDK to manipulate queue states from the Express app.
- R4. **Volume Heuristics for Cost Estimation:** Instead of a complex GCP Billing API integration, the dashboard will calculate and display highly accurate _heuristic cost estimates_ based on the volume of processed records and known fixed unit economics.
- R5. **Low-Latency Superadmin UI:** The React frontend (`SuperadminDashboard.tsx`) must load instantly by subscribing to the aggregated Firestore documents.
- R6. **Security:** Routes and data must be strictly protected by existing Firebase Custom Claims (`requireSuperadmin` middleware).

## Cost Baseline & Estimation Heuristics

To power R4 (Volume Heuristics), we establish the following real cost baseline for the pipeline to display accurate estimates in the UI without dynamic API calls:

- **Gemini 3.1 Flash (Primary Extraction):** ~$0.075 / 1M input tokens. Assuming 1,000 tokens per scraped domain payload, cost is ~$0.000075 per domain. **100,000 domains = ~$7.50**.
- **Gemini 3.1 Pro (QC Audit - 1% Sample):** ~$1.25 / 1M input tokens. Auditing 1,000 domains (1% of 100k) at ~1k tokens each = **~$1.25**.
- **GCP Infrastructure (Cloud Run / Cloud Tasks / BigQuery):** Cloud Tasks is $0.40 per million ops. BigQuery is $6.25 per TiB scanned (our filtered queries scan megabytes). Cloud Run array jobs cost pennies per vCPU hour. **Total Infra = ~$1.50**.
- **Total Estimated Pipeline Cost:** **~$1.00 USD per 10,000 domains processed.** The UI will use this $0.0001 per-unit heuristic to translate "Domains Processed" into an "Estimated Spend" figure instantly.

## Key Technical Decisions

- **Decision:** Product Pivot - Drop Infra Monitoring & Live Billing API.
  **Rationale:** Based on `product-lens-reviewer` evaluation, building bespoke React UI for infrastructure monitoring or reconciling exact GCP billing is a misallocation of resources. We will focus on data quality intelligence and volume heuristics.
- **Decision:** Firestore Global Circuit Breaker over Cloud Tasks SDK.
  **Rationale:** Using the `@google-cloud/tasks` SDK to pause queues requires granting the Node.js BFF `roles/cloudtasks.queueAdmin` privileges, violating least-privilege principles and tightly coupling the app to infra logic. A simple Firestore flag read by the workers natively aligns with our architecture and requires zero new permissions.
- **Decision:** Asynchronous BQ-to-Firestore Sync Worker.
  **Rationale:** BigQuery is an OLAP data warehouse. Querying it synchronously from an Express route to serve a live React dashboard invites page load timeouts and high costs. A scheduled worker syncing to Firestore ensures a snappy UX.

## Implementation Units

- **Unit 1: Data Quality Sync Worker (Cron)**
  **Goal:** Aggregate BigQuery data quality metrics (and volume counts for cost heuristics) and cache them in Firestore.
  **Requirements:** R2, R4
  **Dependencies:** `hyper-scale-saas-data-moat-pipeline`

  **Files:**
  - Create: `src/server/workers/dataQualitySyncWorker.ts`
  - Modify: `src/server/routes/cronRoutes.ts`
    **Approach:** Write a scheduled worker that queries BigQuery for: 1) Total active vs. quarantined records. 2) The 50 most recent quarantined domains and their LLM penalty reasoning. 3) Total records processed today. It writes this payload to `admin_dashboards/data_quality` in Firestore.

- **Unit 2: Pipeline Circuit Breaker (The "Pause" Switch)**
  **Goal:** Safely halt pipeline execution via an operational toggle.
  **Requirements:** R3
  **Dependencies:** None
  **Files:**
  - Modify: `src/server/superadminRoutes.ts` (Add `POST /pipeline/toggle-pause`)
  - Modify: `scripts/seed-domains.ts` (or the primary entry dispatcher)
  - Modify: `src/server/routes/workerRoutes.ts` (Workers check `is_paused` before LLM calls)
    **Approach:** Create an endpoint to toggle `is_paused` in a Firestore `config/pipeline_state` document. Update the dispatching service to halt enqueuing. Crucially, update the heavy downstream workers (e.g., `auditWorker`, `vision-ml`) to also fetch this document. If `is_paused === true`, the worker logs a warning and returns `503 Service Unavailable`. This leverages Cloud Tasks' native exponential backoff—suspending execution and preserving the queue without burning Gemini tokens.

- **Unit 3: Superadmin UI Integration**
  **Goal:** Display the metrics, cost heuristics, and the Kill Switch to product leadership.
  **Requirements:** R1, R4, R5, R6
  **Dependencies:** Unit 1, Unit 2
  **Files:**
  - Modify: `src/components/SuperadminDashboard.tsx`
  - Create: `src/components/superadmin/DataMoatControlTab.tsx`
    **Approach:** Add a new tab to the superadmin interface. Display top-level metrics (Quarantine Rate, Total Processed, Estimated Spend calculated via `count * $0.0001`). Add a prominent "Pause Data Pipeline" toggle. Display a simple table of recently quarantined domains with their LLM reasoning to spot hallucination trends.

## Risks & Dependencies

| Risk                      | Mitigation                                                                                                                                                                                                                                         |
| :------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BigQuery Query Costs      | The sync worker runs on a cron schedule (e.g., hourly), strictly bounding BigQuery query costs compared to executing per-page-load.                                                                                                                |
| In-Flight Task Completion | The Firestore circuit breaker stops _new_ tasks from being dispatched or processed at major phase boundaries. Tasks already handed to a Cloud Run container will finish executing, which is acceptable and prevents corrupted intermediate states. |
| Scope Creep               | Product leadership may request "just one more chart" (e.g., latency, active RAM). We strictly push back, routing infra requests to Looker Studio or GCP Dashboards.                                                                                |
