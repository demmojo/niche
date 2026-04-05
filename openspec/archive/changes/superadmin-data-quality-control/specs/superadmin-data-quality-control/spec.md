# Spec: Superadmin Data Quality Dashboard & Pipeline Control

## Detailed Features

### 1. Data Quality Sync Worker (Cron)

A scheduled worker executing asynchronously. It queries BigQuery for:

- Total active vs. quarantined records.
- The 50 most recent quarantined domains and their specific LLM penalty reasoning.
- Total records processed today.
  Results are written to a single Firestore document at `admin_dashboards/data_quality`.

### 2. Pipeline Circuit Breaker (The Pause Switch)

A global state flag located at `config/pipeline_state { is_paused: boolean }` in Firestore.

- Superadmins toggle this via `POST /pipeline/toggle-pause`.
- Heavy downstream workers (like `auditWorker`) check this flag. If `true`, they log a warning and return `503 Service Unavailable`, leveraging Cloud Tasks' native exponential backoff without burning Gemini tokens.

### 3. Superadmin UI Integration

A new React tab (`DataMoatControlTab`) subscribing to `admin_dashboards/data_quality`.

- Calculates Estimated Spend dynamically: `Total Processed * $0.0001`.
- Displays the prominent "Pause" switch.
- Renders a data table of recently quarantined domains.

## Scenarios

- **SCENARIO: Viewing Dashboard**
  - **WHEN** a superadmin loads the Data Quality & Control tab
  - **THEN** they instantly see quarantine rates and recent LLM penalty reasons fetched from Firestore
  - **AND** they see an estimated cost calculated via volume heuristics.

- **SCENARIO: Pausing the Pipeline**
  - **WHEN** a superadmin clicks the "Pause Data Pipeline" toggle
  - **THEN** the `is_paused` flag is set to `true` in Firestore
  - **AND** downstream workers encounter the flag and return `503` to backoff Cloud Tasks queues safely.
