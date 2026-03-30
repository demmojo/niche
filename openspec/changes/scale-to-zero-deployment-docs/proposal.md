## Why

Deploying a multi-service, scale-to-zero application leveraging Google Cloud Run, Cloud Tasks, and Firebase can be incredibly complex. A developer attempting to spin this up needs to know precisely which accounts to create, what environment variables are required, and the correct order of operations (e.g., containerization vs. Terraform).

Without minimal, highly accurate, step-by-step documentation, the cognitive load is too high, and the risk of misconfiguration (especially regarding security patterns like OIDC internal routes and secret management) increases drastically. We need a definitive "Zero to One" guide in the `README.md` that acts as an opinionated DevOps runbook.

## What Changes

The `README.md` will be updated with a comprehensive "☁️ Scale-to-Zero Deployment Guide". This guide will break down the deployment into discrete, copy-pasteable steps while highlighting best practices and security considerations.

## Capabilities

### New Capabilities

- `deployment-runbook`: A step-by-step, minimal cognitive-load guide covering GCP/Firebase setup, Terraform execution, and Docker builds.
- `security-blueprint`: Explicit documentation of OIDC validation, Secret Manager usage, and distroless container best practices.

### Modified Capabilities

- `readme-documentation`: Existing deployment or setup instructions will be overhauled and integrated into this new flow.

## Impact

The primary impact is on Developer Experience (DevEx) and onboarding. No functional code changes to the application logic are expected. It touches `README.md` exclusively.
