# Tasks: Superadmin Data Quality Dashboard & Pipeline Control

## Phase 1: Data Quality Sync Worker

- [x] Create `src/server/workers/dataQualitySyncWorker.ts`.
- [x] Write SQL to aggregate BigQuery metrics (active vs. quarantine, top 50 recent quarantined domains, daily processed volume).
- [x] Implement write logic to save payload to Firestore (`admin_dashboards/data_quality`).
- [x] Register the new worker in `src/server/routes/cronRoutes.ts` with an appropriate schedule.

## Phase 2: Pipeline Circuit Breaker

- [x] Add `POST /pipeline/toggle-pause` protected endpoint in `src/server/superadminRoutes.ts`.
- [x] Modify `scripts/seed-domains.ts` (dispatcher) to halt enqueueing when `is_paused === true`.
- [x] Update `src/server/routes/workerRoutes.ts` heavy workers to check the Firestore `is_paused` flag and return `503` if active.

## Phase 3: Superadmin UI Integration

- [x] Create `src/components/superadmin/DataMoatControlTab.tsx`.
- [x] Integrate the new tab component into `src/components/SuperadminDashboard.tsx`.
- [x] Implement metrics summary cards (Quarantine Rate, Total Processed).
- [x] Implement dynamic heuristic cost calculator (`Total Processed * 0.0001`).
- [x] Build the UI toggle wired to the `POST /pipeline/toggle-pause` endpoint.
- [x] Render the data table for recently quarantined domains and their LLM penalty reasoning.
