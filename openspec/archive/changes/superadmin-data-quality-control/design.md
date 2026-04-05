# Design: Superadmin Data Quality Dashboard & Pipeline Control

## Context

Superadmins need visibility into the NicheAI Data Moat operations, but displaying raw infrastructure metrics or live billing data inside a React dashboard is a massive anti-pattern that leads to un-actionable noise and heavy maintenance.

## Goals

- Expose actionable Business Intelligence (LLM quarantine reasons, pass/fail rates).
- Enforce the "Snapshot Beats the Fetch" architecture via async state sync.
- Provide a secure global "Pause" functionality.
- Estimate operational costs using reliable volume heuristics.

## Non-Goals

- Replicating native GCP Monitoring features (e.g., Cloud Tasks queue depths).
- Direct integration with the GCP Billing API.
- Synchronous OLAP querying from Express BFF routes on page load.

## Decisions

- **Focus on BI over Infrastructure:** We will drop live billing API and infra monitoring in favor of data quality intelligence and volume heuristics. Baseline cost is determined to be ~$1.00 USD per 10,000 domains.
- **Firestore Circuit Breaker over Cloud Tasks SDK:** We will use a Firestore flag (`config/pipeline_state.is_paused`) to pause the pipeline. This avoids granting node workers `roles/cloudtasks.queueAdmin` and strictly aligns with least-privilege principles.
- **Async BQ-to-Firestore Sync Worker:** A scheduled worker will pre-aggregate BigQuery OLAP data and push it to Firestore to ensure the Superadmin React UI loads instantly and bounds query costs.

## Risks & Trade-offs

- **BigQuery Query Costs:** Running complex queries could get expensive; we mitigate this by confining execution to a cron schedule rather than per-page-load.
- **In-Flight Task Completion:** The pause switch stops _new_ task processing. Tasks currently executing in a Cloud Run container will finish, which is actually preferable to prevent corrupted intermediate states.
- **Scope Creep:** Stakeholders may request real-time infra metrics. We will strictly push back and route them to native GCP dashboards.
