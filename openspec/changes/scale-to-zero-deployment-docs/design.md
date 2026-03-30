## Context

The recent migration to a Google Cloud Run Scale-to-Zero architecture involved significant shifts:

- From Redis/BullMQ to Google Cloud Tasks for queueing.
- From Piscina threading to HTTP-driven worker containers.
- OIDC internal token verification for secure background job invocation.
- Google Secret Manager integration via Terraform.

Deploying this involves prerequisites across Firebase and GCP, Docker image builds (using a multi-stage distroless setup), and a specific Terraform execution order. Documentation must be lean, accurate, and completely unambiguous.

## Goals / Non-Goals

**Goals:**

- Provide a step-by-step Runbook to deploy the application from scratch.
- List exact environment variables needed, with descriptions.
- Outline prerequisites (GCP billing, Artifact Registry, Firebase Web App).
- Explicitly detail security considerations (IAM Service Accounts, OIDC).

**Non-Goals:**

- A deep dive into the inner workings of Terraform or Docker. We want to tell the developer _how_ to deploy it, not _how the tools work_.
- Exhaustive documentation of every possible error state. Keep the golden path clear.

## Decisions

**1. Structure the Guide Sequentially**

- **Decision**: The README will guide the user through: 1) Account Setup & APIs, 2) Firebase Config, 3) Container Build, 4) Terraform Apply, 5) Post-Deploy.
- **Rationale**: This is the natural lifecycle of a deployment. Splitting it by domain prevents the developer from context-switching too frequently.
- **Alternatives Considered**:
  - _All-in-one script_: Rejected because Terraform and Docker builds often need manual debugging if prerequisites fail. A script hides too much context and makes it harder to learn.

**2. OIDC Security Callout**

- **Decision**: Dedicate a brief "Security Patterns" section that explicitly explains _why_ the worker routes use OIDC token verification.
- **Rationale**: Internal service-to-service communication is a critical security vulnerability point. Developers need to understand that the `web` service pushes to Cloud Tasks, which securely authenticates to the `worker` service.

## Risks / Trade-offs

- **Risk: Documentation Stagnation** -> The more detailed the guide, the faster it goes out of date when GCP changes its UI or CLI flags.
- **Mitigation**: Rely heavily on Infrastructure as Code (Terraform) to do the heavy lifting. Only document the commands to execute the IaC, rather than manual UI clicks wherever possible.

## Future Potential & Wow Features

- **Automated CI/CD Workflows**: Create GitHub Actions workflows that automatically build, push to Artifact Registry, and run `terraform apply` on push to `main`. This reduces the deployment cognitive load to exactly zero.
- **Architectural / Design To-Do**: Fully automate Firebase provisioning via the Terraform provider, eliminating the manual Web App creation step entirely.
