# Specification: Cloud Run Scale-to-Zero Deployment

## Detailed Features

### 1. Docker Multi-Stage Optimization

- **Stage 1 (Builder)**: Base `node:22-alpine`, install all dependencies (`npm ci`), run frontend Vite build, and execute backend TypeScript pre-compilation (`tsc` or `esbuild`).
- **Stage 2 (Runtime)**: Base `gcr.io/distroless/nodejs22-debian12`. Use `COPY --chown=nonroot:nonroot`. Run `npm ci --omit=dev`. Set `NODE_ENV=production` and execute using direct Node CLI `CMD ["node", "dist/server/index.js"]`.

### 2. Terraform Infrastructure

- **Services**: Provision `google_cloud_run_v2_service` for `web` and `worker` workloads.
- **Configuration Defaults**: `min_instance_count = 0`, `cpu_idle = true`, `startup_cpu_boost = true`.
- **Worker Specifics**: `timeout_seconds = 1800` (30 mins), lower `max_instance_request_concurrency`.
- **IAM Service Accounts**: A dedicated `nicheai-cloudrun-sa` with `roles/secretmanager.secretAccessor` and restricted privileges.

### 3. API & Middleware Refactoring

- **Queue Replacement**: All occurrences of `queue.add()` are replaced with `@google-cloud/tasks` SDK client calls.
- **Worker Routes**: Create `/api/internal/worker/*` endpoints. Protect these endpoints using an Express middleware leveraging `google-auth-library` to verify the OIDC JWT token's signature, `aud`, and `iss`.

### 4. Cron & Intervals

- All `setInterval` logic (e.g., Tarpit Clustering, orphaned job sweeps) are extracted to `/api/internal/cron/*` endpoints, secured by OIDC.
- Triggered dynamically by Terraform-provisioned `google_cloud_scheduler_job` resources.

## Scenarios

- **WHEN** the application is deployed,
  **THEN** Terraform creates the web service, worker service, Cloud Tasks queue, and Secret Manager entries with $0 base cost.

- **WHEN** a user initiates a heavy ML campaign,
  **THEN** the API constructs a Cloud Task payload (containing only the job ID) and immediately returns a `202 Accepted`.

- **WHEN** Cloud Tasks dispatches the payload to the worker service,
  **THEN** the worker authenticates the OIDC JWT, retrieves the full prompt from Firestore, keeps the HTTP request alive (preserving CPU), processes the ML task, and returns `200 OK`.

- **WHEN** the worker is idle and no background HTTP requests are active,
  **THEN** Cloud Run immediately throttles the CPU to exactly 0, scaling the instance down based on the `min_instance_count = 0` policy.
