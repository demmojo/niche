# Proposal: Cloud Run Scale-to-Zero Deployment

## Why

NicheAI requires a production-ready, highly cost-efficient deployment architecture. The primary business objective is to minimize fixed running infrastructure costs to exactly $0 when the application receives no traffic, without compromising application security, maintainability, or scalability. Currently, there is no containerization strategy or Infrastructure as Code (Terraform) to deploy to GCP.

## What Changes

1. **Containerization**: Introduce a multi-stage Docker build transitioning to a distroless runtime environment.
2. **Infrastructure as Code**: Provision Google Cloud Run, Artifact Registry, Secret Manager, Cloud Tasks, and Cloud Scheduler using Terraform.
3. **Architecture Shift**: Transition from pull-based background workers (BullMQ) to push-based serverless queues (Google Cloud Tasks) to support scale-to-zero constraints.

## Capabilities Introduced

- **Strict Scale-to-Zero**: Cloud Run instances scale to exactly 0 when idle.
- **Multi-Stage Distroless Docker Build**: Eliminates `tsx` in production, uses pre-compiled JS, and leverages `gcr.io/distroless/nodejs22-debian12` for optimal security.
- **Serverless Worker Architecture**: Seamless ML orchestration via Cloud Tasks over authenticated HTTP endpoints.
- **Secure Secret Management**: Google Secret Manager integration mapped directly into container environments.

## Impact

- Drastic cost reduction (approaching $0 idle cost) by dropping always-on VMs and Redis.
- Enhanced security posture via least-privilege IAM, secret resolution at runtime, and non-root execution.
- Improved reliability by preventing silent job failures caused by CPU throttling.
