# Specification: Production Resilience (Phase 2)

## Detailed Features

### 1. Zero-Code Secret Management

Integrate GCP Secret Manager with Cloud Run deployments.

- **SCENARIO:** Service startup
  - **WHEN:** The Cloud Run instance starts up.
  - **THEN:** Secrets are injected directly into `process.env` (no volume mounts).

### 2. True Disaster Recovery

Configure data retention and backup processes.

- **SCENARIO:** Accidental data deletion
  - **WHEN:** A document is accidentally deleted or corrupted within the last 7 days.
  - **THEN:** Firestore PITR allows instant rollback to a specific minute.
- **SCENARIO:** Long-term compliance archiving
  - **WHEN:** The weekly Cloud Scheduler cron job executes.
  - **THEN:** Firestore triggers an export to a cold-line Cloud Storage bucket with a 90-day lifecycle deletion rule.

### 3. Safe Security Headers

Implement `helmet` and `cors` middlewares in the Express backend.

- **SCENARIO:** API Request Security
  - **WHEN:** A client requests an API endpoint.
  - **THEN:** The response includes a `Content-Security-Policy-Report-Only` header.
  - **AND THEN:** Strict CORS validates the origin, only allowing the production Firebase Hosting domain.

### 4. PII-Scrubbed Error Tracking

Integrate `@sentry/node` and `@sentry/react`.

- **SCENARIO:** Application Crash / Unhandled Exception
  - **WHEN:** An unhandled Promise rejection or exception occurs in the backend or frontend.
  - **THEN:** Sentry captures the error stack trace.
  - **AND THEN:** The `beforeSend` hook strips all Authorization headers, IP addresses, and raw LLM prompts before transmission to Sentry servers.

### 5. Non-Cascading Uptime Monitoring

Deploy a decoupled liveness endpoint.

- **SCENARIO:** Load Balancer Liveness Check
  - **WHEN:** The GCP Load Balancer hits `/healthz`.
  - **THEN:** The Express server responds with 200 OK in < 5ms.
  - **AND THEN:** No downstream database (Firestore) query is executed.
