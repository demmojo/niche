# Tasks: Production Resilience (Phase 2)

## Phase 1: Infrastructure & Data Durability

- [ ] `configure-secret-manager`: Map Google Secret Manager secrets directly to Cloud Run environment variables (`gcloud run deploy --set-secrets`) to bypass volume mounts.
- [ ] `configure-firestore-dr`: Enable Firestore PITR via CLI.
- [ ] `configure-firestore-dr`: Create a Cloud Scheduler job for weekly cold-storage exports to a GCS bucket with a 90-day lifecycle rule.

## Phase 2: Security & Telemetry

- [ ] `implement-safe-security-headers`: Install `helmet` and `cors`.
- [ ] `implement-safe-security-headers`: Configure Helmet with a Report-Only Content Security Policy (CSP).
- [ ] `implement-safe-security-headers`: Configure strict CORS whitelisting only the production Firebase Hosting domain.
- [ ] `integrate-sentry-scrubbed`: Initialize `@sentry/react` and `@sentry/node`.
- [ ] `integrate-sentry-scrubbed`: Implement `beforeSend` hooks to aggressively scrub PII, auth tokens, and raw LLM prompts. Add unit tests for scrubbing logic.

## Phase 3: Uptime Monitoring

- [ ] `implement-shallow-healthz`: Create a shallow `/healthz` endpoint in `server.ts`.
- [ ] `implement-shallow-healthz`: Ensure `/healthz` responds in < 5ms without querying Firestore.
- [ ] Ensure Vitest coverage remains >95% overall.
