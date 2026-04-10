# Tasks: Production Readiness Pipeline

## Phase 1: Security & Financial Hardening

- [x] Remove `express-rate-limit` and configure GCP Cloud Armor for edge rate limiting.
- [x] Set hard daily cost/request quotas in the GCP project and Gemini API console.
- [x] Add `firebase-admin/app-check` middleware (`requireAppCheck`) to public Express routes.
- [x] Implement Google OIDC JWT validation middleware for internal Cloud Tasks worker routes.

## Phase 2: Decoupling & Observability

- [x] Remove synchronous serving of React `dist/` folder from `server.ts`.
- [x] Deploy React static assets to Firebase Hosting.
- [x] Configure frontend environment to bypass Firebase rewrites and target the Cloud Run API domain directly.
- [x] Install `pino`, `pino-http`, and `@google-cloud/pino-logging-gcp-config`.
- [x] Replace all `console.log` and `console.error` calls with Pino loggers in core routes.

## Phase 3: CI/CD Pipeline & Testing

- [x] Create `.github/workflows/deploy.yml` for automated CI/CD.
- [x] Write Dockerfile utilizing a distroless multi-stage Node.js build.
- [x] Add unit and integration tests for OIDC validation on worker routes.
- [x] Add mocks for `getAppCheck().verifyToken()` in the test suite.
- [x] Ensure global Vitest coverage remains >95%.
