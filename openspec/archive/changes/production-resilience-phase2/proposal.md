# Proposal: Production Resilience (Phase 2)

## Why

Following the initial `production-readiness-pipeline` (which addressed volumetric DoW attacks, caching, and CI/CD), this Phase 2 spec tackles the remaining "Day 2" operational requirements. NicheAI handles sensitive intellectual property (startup ideas) and requires strict security, zero-code secret management, disaster recovery, and robust uptime monitoring.

## What Changes

1. Move from `.env` files to Google Secret Manager.
2. Enable Firestore Point-in-Time Recovery (PITR) and automated weekly cold-line GCS exports.
3. Implement `helmet` for Report-Only Content Security Policy (CSP) and strict CORS.
4. Integrate Sentry for React and Node.js with strict PII-scrubbing mechanisms.
5. Add a shallow `/healthz` endpoint for safe compute liveness checks.

## Capabilities

- **Zero-Code Secrets:** Direct mapping of Google Secret Manager secrets to Cloud Run environment variables.
- **True DR:** Instant 7-day rollback via PITR, plus 90-day cold-storage retention for compliance.
- **Safe Telemetry:** Aggregates stack traces without leaking auth tokens, IP addresses, or raw LLM prompts.

## Impact

Hardens the production application against data loss, security breaches, and catastrophic cascading failure vectors during high-load/latency events, ensuring enterprise-grade resilience.
