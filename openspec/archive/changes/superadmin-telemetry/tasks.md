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
