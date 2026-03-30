## 1. Documentation Writing (README.md)

- [x] 1.1 **Prerequisites & Architecture:** Outline the Scale-to-Zero architecture (Cloud Run, Cloud Tasks, Secret Manager) and the prerequisite GCP/Firebase accounts/APIs to set up. Warn about Firestore Native Mode and App Engine location immutability.
- [x] 1.2 **Environment Variables & Secrets:** Document the `.env` (local) vs. Secret Manager (production) variables, highlighting the minimum required set (`FIREBASE_SERVICE_ACCOUNT_BASE64`, `GEMINI_API_KEY`, etc.). Recommend a GCS bucket for Terraform remote state.
- [x] 1.3 **Build & Publish (Docker):** Write copy-paste commands for authenticating with Artifact Registry, building the multi-stage distroless image (**using `--platform linux/amd64`**), and pushing it.
- [x] 1.4 **Infrastructure as Code (Terraform):** Detail the `terraform init`, `terraform plan`, and `terraform apply` workflow, including setting up `terraform.tfvars`.
- [x] 1.5 **Security Best Practices:** Document the `nicheai-cloudrun-sa` least-privilege IAM pattern, OIDC internal route authentication, Cloud Run CPU Allocation rule (holding the HTTP request open), and the Claim Check pattern for >100KB payloads.

## 2. Review & Refinement

- [x] 2.1 **Clarity Pass:** Ensure all bash commands are easily copy-pasteable. Reduce cognitive load by removing assumed knowledge (e.g., explicitly showing `gcloud auth login`).
- [x] 2.2 **Correctness Check:** Cross-reference the documented variables with `terraform/variables.tf` and `server.ts` to guarantee completeness.
