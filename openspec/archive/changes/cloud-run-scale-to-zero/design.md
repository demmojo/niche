# Design: Cloud Run Scale-to-Zero Deployment

## Context

Deploying to Google Cloud Run natively supports HTTP-triggered scaling to zero. However, existing pull-based polling services like BullMQ fail because Cloud Run aggressively throttles CPU to 0 between HTTP requests, breaking event loops and expiring Redis locks.

## Goals

- Achieve $0 infrastructure cost when the application has zero active users/traffic.
- Ensure background tasks (like ML generation) process reliably up to 30 minutes.
- Eliminate Out-of-Memory (OOM) V8 crashes due to event loop blocking.
- Zero plaintext secrets in Terraform or code repositories.

## Non-Goals

- Multi-region active-active deployment.
- Database migration (Firestore remains as the data layer).
- Modifications to the core ML prompt structures or business logic.

## Decisions

1. **Cloud Tasks over BullMQ**: Replace BullMQ (pull) with Cloud Tasks (push). This ensures CPU is natively allocated for the duration of the HTTP request.
2. **Service Split**: Deploy two distinct Cloud Run services from the same Docker image:
   - `web-service`: High concurrency (e.g., 80) for API/UI.
   - `worker-service`: Low concurrency (e.g., 4) with 30-minute timeouts specifically for CPU-bound ML worker tasks to prevent main event loop blocking.
3. **Distroless Runtime**: Use `gcr.io/distroless/nodejs22-debian12` and explicitly drop `tsx`. All TypeScript will be pre-compiled via Stage 1 to minimize cold-start latency.
4. **Secret Manager**: Terraform will provision secrets, and Cloud Run will inject them natively via `secret_key_ref`.

## Risks & Trade-offs

- **Payload Limits**: Cloud Tasks has a strict 100KB payload limit. **Mitigation**: Pass only `{ "jobId": "123" }` through the queue; workers must fetch full state from Firestore.
- **Cold Starts**: Scale-to-zero intrinsically introduces cold starts. **Mitigation**: Enable `startup_cpu_boost = true` in Terraform and pre-compile all TypeScript.

## Future Potential

- Cloud Scheduler can easily be expanded to handle multi-tenant cron processes and data sweeping.
- Eventarc can be introduced later to trigger workers natively from Firestore changes.
