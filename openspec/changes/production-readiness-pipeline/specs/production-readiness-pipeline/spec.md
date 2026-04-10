# Spec: Production Readiness Pipeline

## Detailed Features

### 1. Edge Rate Limiting (Cloud Armor)

Deprecates `express-rate-limit` local memory stores. Attaches Cloud Armor security policies to the Cloud Run Load Balancer to throttle IPs exceeding configured RPS.

### 2. Asset & API Decoupling

Express no longer serves the React `dist/` directory. Firebase Hosting serves static assets via CDN. The React app connects directly to the Cloud Run URL for `/api/*` endpoints to ensure SSE stability.

### 3. Server-Side Authentication

- **Public Routes:** Evaluated by `firebase-admin/app-check`. Missing/invalid tokens return 401.
- **Internal Routes:** Background workers triggered by Cloud Tasks evaluate `google-auth-library` OIDC JWTs.

### 4. Observability & CI/CD

Integrates `pino`, `pino-http`, and `@google-cloud/pino-logging-gcp-config` for structured logging. A `.github/workflows/deploy.yml` pipeline builds a multi-stage distroless Docker image and deploys to Cloud Run.

## Scenarios

**Scenario: Volumetric DoW Attack**

- **WHEN** an attacker blasts the API with thousands of requests per second
- **THEN** Cloud Armor drops the traffic at the edge, returning 429, without spinning up Cloud Run containers.

**Scenario: Streaming LLM Responses**

- **WHEN** the React client initiates an SSE stream to `/api/llm/generate`
- **THEN** the connection goes directly to Cloud Run, avoiding Firebase Hosting's 60-second buffering timeout.

**Scenario: Internal Cloud Task Execution**

- **WHEN** Cloud Tasks dispatches a webhook to an internal backend route
- **THEN** the server validates the OIDC token instead of requiring an App Check token.

**Scenario: Exceeding Budget Thresholds**

- **WHEN** daily API usage hits the specified financial limit
- **THEN** hard quotas immediately reject further API calls to GCP/Gemini, halting costs instantly.
