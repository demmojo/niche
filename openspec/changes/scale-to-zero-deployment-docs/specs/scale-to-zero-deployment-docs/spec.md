# Scale-to-Zero Deployment Guide

This OpenSpec outlines the documentation required to correctly set up, deploy, and configure the NicheAI platform on Google Cloud Run with a 100% scale-to-zero ($0 idle cost) architecture.

## Features

### 1. Prerequisite Accounts & APIs

- **Requirement:** List exact steps to configure Google Cloud and Firebase.
- Detail the necessary APIs to enable: Cloud Run, Artifact Registry, Cloud Tasks, Cloud Scheduler, Secret Manager, Cloud Build.
- Detail the Firebase configuration: Firestore in Native Mode, Authentication, Firebase Hosting (if applicable).
- Note that Cloud Tasks requires an App Engine application to exist in the GCP project, and the region is immutable.

### 2. Environment Variables & Secrets

- **Requirement:** Document the `.env` (local) and Secret Manager mapping for deployment.
- Explain variables like `GOOGLE_CLOUD_PROJECT`, `GEMINI_API_KEY`, `FIREBASE_SERVICE_ACCOUNT_BASE64`, etc.
- Emphasize that the Firebase Admin Key must be base64-encoded to prevent multiline string parsing errors.

### 3. Build & Publish (Docker)

- **Requirement:** Provide copy-paste commands to build and tag the multi-stage distroless image.
- Explicitly mandate `docker buildx build --platform linux/amd64` to prevent `exec format error` crashes on Cloud Run for developers using Apple Silicon.

### 4. Infrastructure Provisioning (Terraform)

- **Requirement:** Explain how to run `terraform init`, `plan`, and `apply`.
- Detail the minimum required `terraform.tfvars` configuration.
- Recommend setting up a GCS bucket for Terraform remote state.

### 5. Security Practices & Patterns

- **Requirement:** Explain the architectural choices (Cloud Run Service Account bindings, least-privilege IAM roles, internal OIDC authentication for worker endpoints).
- **Requirement:** Explain the Cloud Run CPU Allocation rule: worker endpoints MUST hold the HTTP request open until the background task finishes.
- **Requirement:** Explain the Claim Check pattern for payloads > 100KB.

## Scenarios

_Note: Since this is documentation only, scenarios map to manual developer verification steps rather than automated tests._

- **WHEN** a developer follows the prerequisites section
- **THEN** they should have a GCP project with a billing account attached, all APIs enabled, and a valid `gcloud` session authenticated.

- **WHEN** a developer executes the Docker build steps
- **THEN** a local image should be successfully pushed to Google Artifact Registry.

- **WHEN** a developer executes the Terraform plan/apply
- **THEN** the Cloud Run services, Cloud Tasks queues, and Secret Manager entries should be provisioned without error, outputting the public URLs.
