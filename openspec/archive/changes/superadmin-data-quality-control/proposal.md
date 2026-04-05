# Proposal: Superadmin Data Quality Dashboard & Pipeline Control

## Why

The current Hyper-Scale SaaS Data Moat pipeline runs completely headless. Superadmins lack visibility into data quality (specifically which domains are quarantined by the LLM-as-a-Judge and why) and do not have an easy "kill switch" to halt the pipeline in the UI if anomaly rates spike or budgets are threatened.

## What Changes

We will add a "Data Quality & Control" tab within the NicheAI Superadmin Dashboard. To avoid OLAP anti-patterns and IAM bloat, this feature introduces an asynchronous BigQuery-to-Firestore sync cron and a global Firestore-backed circuit breaker.

## Capabilities

- Instantly view data quality metrics (quarantine rates, recent failing domains, LLM penalty reasoning).
- Calculate and display highly accurate heuristic cost estimates based on processed volumes.
- Gracefully halt (pause) the data pipeline via a UI toggle without needing GCP Console access.

## Impact

Superadmins gain essential business intelligence and operational control to prevent runaway AI token costs, completely bypassing the latency of synchronous BigQuery queries and the complexity of native GCP billing integrations.
