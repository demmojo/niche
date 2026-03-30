# Tasks: Cloud Run Scale-to-Zero Deployment

## Phase 1: Containerization

- [x] Create `.dockerignore` targeting `node_modules`, `dist`, `.env`, and git artifacts.
- [x] Implement Stage 1 `Dockerfile` (builder) with TS pre-compilation setup.
- [x] Implement Stage 2 `Dockerfile` (distroless) using `nonroot` user and omitting `tsx`.
- [x] Verify local image build and ensure pure Node.js execution works seamlessly.

## Phase 2: Application Refactoring

- [x] Remove `bullmq` and `redis` dependencies. Replace with `@google-cloud/tasks` SDK.
- [x] Implement Cloud Tasks dispatch wrapper logic (passing ID-only payloads).
- [x] Implement Express routes for background workers under `/api/internal/worker/*`.
- [x] Implement Express OIDC JWT Verification middleware utilizing `google-auth-library` to secure internal routes.
- [x] Refactor in-memory `setInterval` tasks and startup sweeps into `/api/internal/cron/*` endpoints.
- [x] Remove Piscina thread-hopping/worker threads; rely strictly on standard async/await for endpoint workflows.

## Phase 3: Infrastructure as Code (Terraform)

- [x] Initialize `terraform` directory with `main.tf`, `variables.tf`, and `outputs.tf`.
- [x] Define `google_artifact_registry_repository`.
- [x] Provision dedicated Cloud IAM Service Account (`nicheai-cloudrun-sa`) and bind Secret Accessor roles.
- [x] Define `google_secret_manager_secret` resources for environment variables.
- [x] Provision `google_cloud_run_v2_service` for `web` (high concurrency, 5m timeout).
- [x] Provision `google_cloud_run_v2_service` for `worker` (low concurrency, 30m timeout).
- [x] Provision `google_cloud_tasks_queue` with explicit rate limiting/concurrency boundaries.
- [x] Provision `google_cloud_scheduler_job` triggers for cron endpoints.

## Phase 4: Finalization & Documentation

- [x] Update `README.md` with new `## ☁️ Deployment` section outlining build/deploy steps.
- [x] Document Terraform variable requirements (GCP region, project ID, secret definitions).
- [x] Run dry-run load testing to verify scale-to-zero recovery speed (`startup_cpu_boost` testing).
