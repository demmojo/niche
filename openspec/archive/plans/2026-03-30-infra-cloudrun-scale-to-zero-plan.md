# Plan: Cloud Run Scale-to-Zero Deployment

## 1. Problem Statement

NicheAI requires a production-ready, highly cost-efficient deployment architecture. The primary goal is to minimize fixed running costs to exactly $0 when the application receives no traffic, without compromising security or scalability. Currently, there is no containerization strategy (`Dockerfile`) or Infrastructure as Code (Terraform) to deploy the app to Google Cloud Run, which is the target environment.

## 2. Proposed Solution

Containerize the Node.js (Express) + Vite (React) application and deploy it to Google Cloud Run using Terraform, explicitly enforcing a "scale-to-zero" configuration.

### Capabilities Introduced

- **Multi-Stage Docker Build**: A lean production image using a two-stage build process to optimize layer caching and minimize cold-start latency.
- **Serverless IaC (Terraform)**: Configuration for Google Cloud Run and Google Artifact Registry to automate deployment.
- **Strict Scale-to-Zero**: Explicitly configuring `min_instance_count = 0` to ensure costs are strictly driven by usage.
- **Security Posture**: Running the Node.js process as a non-root user (`node`).

## 3. Technical Approach

### 3.1. Codebase Constraints Analysis

- The backend relies on environment variables (`GEMINI_API_KEY`, `FIREBASE_PROJECT_ID`, `FIREBASE_SERVICE_ACCOUNT_BASE64`).
- No stateful, local filesystem persistence (`fs.writeFileSync`) was found in `server.ts` or routes that would break in a stateless container (existing `fs` usage is for telemetry/sync diffs that are read-only or in-memory before Firestore commits).
- Dependencies: Need to ensure `npm ci --omit=dev` runs correctly and `tsx` is available globally in the production container to start the Express server.

### 3.2. Dockerfile Configuration

- **Stage 1 (Builder)**: `node:22-alpine` (or `node:22-bookworm-slim`), install all dependencies, copy source, run frontend build (`npm run build`). Critically, **pre-compile the backend TypeScript** to pure JavaScript (e.g., using `tsc` or `esbuild`) to completely eliminate `tsx` from production.
- **Stage 2 (Runtime)**: `node:22-alpine` (or distroless `gcr.io/distroless/nodejs22-debian12` for maximum security and minimal footprint).
  - Install only production dependencies (`npm ci --omit=dev`).
  - **Do NOT install `tsx`**: On-the-fly TS compilation via `tsx` causes severe CPU-bound latency bottlenecks during container cold starts.
  - Copy `dist/` and backend compiled JS files, set `NODE_ENV=production`, `PORT=8080`, and switch to the `node` user (or use `nonroot` in distroless).
  - **Direct Node Execution**: Use `CMD ["node", "dist/server/index.js"]` (or equivalent) instead of `npm start` to save ~30-50ms of CLI overhead.

### 3.3. Terraform Configuration

- `main.tf`:
  - Provider: `google`
  - Resources: `google_artifact_registry_repository` and `google_cloud_run_v2_service`.
  - Service configuration: `min_instance_count = 0`, `container_port = 8080`, and environment variables mapped from Terraform variables.
  - **Cold Start Optimizations (2026 Best Practices)**:
    - Explicitly set `startup_cpu_boost = true` in the container `resources` block. This temporarily allocates additional vCPUs during initialization, drastically cutting down Node.js bootstrap time before the container begins serving traffic.
    - Explicitly set `cpu_idle = true` to guarantee the $0 cost scaling model (throttling CPU to 0 between requests).
    - Allocate at least `memory = "512Mi"` or `"1024Mi"`, even if unused, as Cloud Run dynamic routing and CPU allocation loosely correlate with configured memory limits.
    - Tune `max_instance_request_concurrency` (e.g., `80` up to `250`) to handle more async I/O per instance, reducing the probability of concurrent traffic spikes triggering new cold starts.
  - IAM: Public unauthenticated access for the service.
- `variables.tf`: Define variables for GCP region, project ID, max instances, and sensitive secrets (Gemini API key, Firebase creds).
- `outputs.tf`: Export the public Cloud Run URL and the Artifact Registry path.

### 3.4. Background Workers (BullMQ) & $0 Scale-to-Zero Architecture

- **The Conflict**: BullMQ relies on a _pull-based_ polling mechanism via Redis. When an HTTP request ends (e.g., returning `202 Accepted`), Cloud Run immediately throttles the CPU to 0. This instantly freezes any running BullMQ Sandboxed Processors, causing silent job failures, lock timeouts, and broken ML orchestration workflows. "Always-on CPU" solves this but violates the strict $0 cost requirement.
- **Architectural Solution (The "Push-Based" Serverless Queue)**:
  To truly support $0 cost scale-to-zero without breaking NicheAI's background jobs, the architecture must transition from a pull model to a **push model**.
  1. **Google Cloud Tasks**: Replace BullMQ enqueueing with Google Cloud Tasks. When a user starts a campaign, the server creates a Cloud Task and returns `202 Accepted`.
  2. **Active HTTP Keep-Alive**: Cloud Tasks executes the background job by making an authenticated `POST` request to an internal Cloud Run endpoint (e.g., `/api/internal/workers/campaign`).
  3. **CPU Preservation**: Because the Cloud Task holds the HTTP request open for the duration of the ML workload (up to 30 minutes limit for HTTP targets), Cloud Run natively keeps the CPU allocated.
  4. **Scale-to-Zero**: Once the job finishes and the endpoint returns `200 OK`, the HTTP request terminates, and Cloud Run instantly throttles the CPU back to exactly 0.
- **Immediate Mitigation Strategy (The "Queue Drain" Keep-Alive Bridge)**:
  If replacing BullMQ's Sandboxed Processors with Cloud Tasks is too large of a refactor for this initial deployment, implement an HTTP "Keep-Alive" Bridge.
  - When the app enqueues a job to BullMQ, it concurrently triggers a lightweight Cloud Task (or background HTTP ping) pointing to a `/api/internal/drain-queue` endpoint.
  - This endpoint executes `await queue.waitUntilEmpty()` and holds the HTTP connection open until BullMQ finishes processing all pending jobs.
  - This "tricks" Cloud Run into legally keeping the CPU allocated for BullMQ's background threads, successfully scaling to zero immediately afterward.

## 4. Implementation Steps

### Phase 1: Containerization

1. Create `.dockerignore` to exclude `node_modules`, `dist`, `.env`, `.git`, etc.
2. Create `Dockerfile` with the optimized multi-stage build.

### Phase 2: Infrastructure as Code

1. Create `terraform/main.tf` for Cloud Run and Artifact Registry.
2. Create `terraform/variables.tf` and `terraform/outputs.tf`.

### Phase 3: Documentation

1. Update `README.md` with a new `## ☁️ Deployment (Cloud Run & Serverless)` section.
2. Provide commands for local Docker testing (`docker build`, `docker run`) and Terraform execution (`terraform init`, `terraform plan`, `terraform apply`).

## 5. Extracted Code Assets (Stashed)

A functional draft of these files (Dockerfile, Terraform, and README updates) was previously generated and stashed (`git stash show "Scale to Zero Implementation"`). They will be reviewed and applied during the "Apply" phase of this OpenSpec workflow.

## 6. Architecture & Research Insights (Deepened)

### 6.1 Serverless Background Processing (Crucial)

Deploying BullMQ "as-is" in a Cloud Run scale-to-zero environment will result in immediate architectural failures. BullMQ relies on a continuous Node.js event loop to renew Redis locks. When the HTTP request ends and Cloud Run throttles CPU to 0, locks expire and jobs are marked as "stalled".

- **Primary Recommendation (True Serverless):** Migrate completely from BullMQ (Pull) to **Google Cloud Tasks (Push)**. Cloud Tasks invokes standard Express `POST` routes (e.g., `/api/tasks/process-data`). Since it's an HTTP request, Cloud Run natively allocates CPU for the duration of the job, then instantly scales back to 0. This also allows us to drop Redis completely, saving ~$35+/month.
- **Graceful Shutdowns:** Intercept `SIGTERM` in `server.ts` to gracefully pause queues, await active jobs (up to Cloud Run's termination timeout), and update active Firestore job documents to an `interrupted` status to ensure zero data loss (`ml-engineering-standards.mdc`).

### 6.2 Polling & Cron Migration

In-memory `setInterval` loops (e.g., for Tarpit Clustering) will freeze and fail to execute.

- **Recommendation:** Refactor all `setInterval` logic into secured HTTP endpoints (e.g., `/api/cron/tarpit-clustering`) and provision **Google Cloud Scheduler** jobs in Terraform to trigger them.

### 6.3 Thread-Hopping (Piscina)

Spawning Node.js worker threads (Piscina) inside a memory-constrained serverless container violates `ml-engineering-standards.mdc` and increases the risk of V8 Out-Of-Memory crashes.

- **Recommendation:** Remove `Piscina` thread pools. Move worker logic into dedicated HTTP endpoints triggered by Cloud Tasks, running synchronously within the boundaries of the request.

### 6.4 Security & Secret Management

Hardcoding secrets as plaintext environment variables in Terraform (`variables.tf`) risks exposing them in the state file and GCP UI.

- **Recommendation:** Update Terraform to use **Google Secret Manager**. Map secrets into the container using native secret environment variables (`env { value_source { secret_key_ref { ... } } }`).

### 6.5 Subagent Technical Review Insights (Deepened)

Following a comprehensive technical review by architecture, security, and GCP framework specialists, several critical gaps in the initial plan were identified and must be addressed during implementation:

#### A. Security & IAM Strictness

1. **Unauthenticated Internal Endpoints (CRITICAL):** Because the Cloud Run service is public, the `/api/internal/*` worker routes are exposed to the internet. We MUST implement an Express middleware using `google-auth-library` to cryptographically verify the OIDC JWT token's signature, audience (`aud`), and issuer (`iss`) to ensure only Cloud Tasks/Scheduler can trigger them.
2. **Dedicated Service Account (HIGH):** Do not use the Default Compute Engine Service Account. Terraform must provision a dedicated `nicheai-cloudrun-sa` with least-privilege access.
3. **Secret Manager IAM (HIGH):** Terraform must explicitly grant `roles/secretmanager.secretAccessor` to the dedicated Service Account for each secret, or the container will fail to boot (CrashLoopBackOff).
4. **Dockerfile Hardening:** Use `gcr.io/distroless/nodejs22-debian12` for the runtime. Ensure `COPY --chown=nonroot:nonroot` is used so files aren't owned by root. Consider configuring a read-only root filesystem in Cloud Run for defense-in-depth.

#### B. Architectural Limits & Event Loop Blocking

1. **The "Keep-Alive Bridge" Anti-Pattern:** The fallback strategy of draining BullMQ via a single HTTP keep-alive is rejected. If the queue takes longer than Cloud Tasks' hard 30-minute maximum, the request will be forcefully killed, resulting in silent data loss. **We must fully migrate to Cloud Tasks.**
2. **Event Loop Blocking vs Concurrency:** If we remove Piscina (worker threads) but set Cloud Run's `max_instance_request_concurrency` to 80-250, a single synchronous ML data parsing task will block the event loop for all other 249 concurrent web requests.
   - _Fix:_ Deploy **two** Cloud Run services from the same Docker image:
     - `web-service`: High concurrency (e.g., 80-250) for fast UI/API traffic.
     - `worker-service`: Low concurrency (e.g., 1 to 4) specifically for CPU-heavy Cloud Tasks, or retain `worker_threads` with `ArrayBuffer` transfers to keep the main event loop unblocked.
3. **Thundering Herd API Limits:** Cloud Tasks will aggressively auto-scale Cloud Run. To prevent instantly exhausting Gemini/Exa API rate limits, the `google_cloud_tasks_queue` Terraform resource MUST explicitly define `max_concurrent_dispatches` to enforce bounded concurrency.

#### C. GCP Framework Quotas

1. **Cloud Tasks Payload Limits:** Cloud Tasks has a strict 100KB payload limit. Do not pass full ML prompts or HTML through the queue. Pass lightweight identifiers (e.g., `{ "jobId": "123" }`) and fetch the heavy payload from Firestore within the worker.
2. **Cloud Run Timeout Mismatch:** Cloud Run defaults to a 5-minute request timeout. Terraform MUST explicitly configure `timeout_seconds = 1800` (30 minutes) on the worker service to match Cloud Tasks' maximum deadline.
3. **Memory Sizing:** `512Mi` is dangerously low for high concurrency + large JSON parsing. Baseline memory should be `1024Mi` or `2048Mi` to prevent V8 OOM crashes.
4. **Thundering Herd Recovery Sweeps:** Do not run the Firestore "orphaned jobs recovery sweep" on server boot (`init`). In a scale-to-zero environment, a traffic spike causing 50 cold starts will trigger 50 simultaneous recovery sweeps. Move this sweep to a dedicated Cloud Scheduler cron endpoint.
