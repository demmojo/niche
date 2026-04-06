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
