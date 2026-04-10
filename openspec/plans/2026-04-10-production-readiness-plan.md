---
name: Production-Readiness-Pipeline
overview: Hardens the NicheAI architecture for a production launch by implementing Cloud Armor rate limiting, independent Cloud Run domain mapping for SSE, App Check and OIDC enforcement, structured telemetry (Pino), and hard GCP API quotas.
todos:
  - id: configure-cloud-armor
    content: Configure GCP Cloud Armor for edge rate limiting instead of deploying a stateful Redis cluster.
    status: pending
  - id: configure-firebase-hosting
    content: Deploy React to Firebase Hosting but maintain direct Cloud Run API domains to prevent SSE buffering timeouts.
    status: pending
  - id: enforce-app-check-and-oidc
    content: Apply requireAppCheck middleware to public routes, and strict OIDC validation for internal Cloud Tasks routes.
    status: pending
  - id: setup-pino-logging
    content: Integrate pino-http in server.ts and replace console.log in core routes.
    status: pending
  - id: setup-gha-docker
    content: Create GitHub Actions workflow for distroless multi-stage Docker deployment.
    status: pending
  - id: enforce-hard-quotas
    content: Enforce hard API quotas in GCP and Gemini to prevent delayed DoW attacks instead of relying on delayed Budget Alert webhooks.
    status: pending
isProject: false
dependencies: []
---

# OpenSpec Plan: Production Readiness Pipeline

**Target File:** `openspec/plans/YYYY-MM-DD-production-readiness-plan.md`

## 1. Executive Summary

This spec hardens the NicheAI architecture to survive a production launch. Based on a comprehensive adversarial architectural review of the existing Express 5.x, React 19, and Firebase stack, we are executing a surgical 6-point plan. This mitigates critical risks including Denial of Wallet (DoW) attacks on expensive LLM APIs, single-node memory bottlenecks, unstructured log blindness, and inefficient static asset delivery. Crucially, it rejects stateful bloat (Redis) in favor of native serverless primitives (Cloud Armor) and protects our SSE streaming capabilities from CDN buffering.

## 2. Core Features & UX Flow

### A. Edge Rate Limiting & DoW Protection (Cloud Armor)

- **Current State:** `express-rate-limit` uses a local `MemoryStore`.
- **Target State:** Deprecate the Node.js rate limiter for public volumetric attacks. Implement GCP Cloud Armor in front of the Cloud Run load balancer.
- **Why not Redis?:** Introducing a stateful Redis cluster violates our serverless, scale-to-zero philosophy. Failing open to a `MemoryStore` during a Redis outage would multiply the DoW attack surface across all scaled instances. Cloud Armor drops malicious traffic at the edge before it wakes up a container.

### B. Frontend Asset Decoupling (Serverless Independence)

- **Current State:** Express serves the React `dist/` folder synchronously.
- **Target State:** Firebase Hosting serves all static assets via its global CDN.
- **Routing:** Do **NOT** proxy `/api/**` through Firebase Hosting rewrites. Firebase Hosting buffers requests and enforces a 60-second timeout, which will instantly kill our Server-Sent Events (SSE) LLM streaming. The frontend will communicate directly with the Cloud Run API domain.

### C. Server-Side App Check & Internal OIDC Enforcement

- **Current State:** Client-side App Check exists, but the backend `requireAppCheck` middleware is not applied to routes.
- **Target State:** The Express server will actively reject unverified public requests (excluding local emulators) using `firebase-admin/app-check`.
- **Internal Auth:** Internal machine-to-machine routes (e.g., background workers triggered by Cloud Tasks) do not generate App Check tokens. We will implement strict Google OIDC JWT validation middleware for these internal routes to prevent "Friendly Fire" blocks.

### D. Structured Logging (Pino)

- **Current State:** `console.log` and `console.error` are unstructured, breaking GCP Log Explorer trace correlation.
- **Target State:** Adopt `pino` and `pino-http` with `@google-cloud/pino-logging-gcp-config` to auto-inject trace IDs and serialize errors.

### E. Automated CI/CD (Multi-Stage Distroless Docker)

- **Current State:** Local/Manual deployments via `gcloud run deploy`.
- **Target State:** A GitHub Actions workflow (`.github/workflows/deploy.yml`) that runs tests, builds the multi-stage distroless Node.js image, pushes to Artifact Registry, and performs a zero-downtime traffic split rollout to Cloud Run.

### F. Hard API Quotas (Replaces Budget Webhooks)

- **Current State:** Cloud Tasks dispatch infinitely until rate-limited.
- **Target State:** Set hard daily cost/request quotas directly on the GCP project and Gemini API console.
- **Why not a Budget Webhook?:** GCP Budget Alerts can be delayed by hours. A volumetric attack could drain thousands of dollars before a custom `PauseQueue` webhook fires. Hard quotas instantly cut off the bleeding at the infrastructure level.

## 3. Technical Implementation Details & Risks

- **Dependencies:** `pino`, `pino-http`, `@google-cloud/pino-logging-gcp-config`, `google-auth-library` (for OIDC).
- **Testing Requirements:**
  - Vitest coverage must remain >95% globally.
  - Integration tests for OIDC validation on worker routes.
  - Mocks for `getAppCheck().verifyToken()`.

## 4. Success Criteria

- [ ] GCP Cloud Armor is actively dropping requests exceeding configured limits.
- [ ] `server.ts` no longer serves the React `dist/` bundle.
- [ ] SSE streams run directly against the Cloud Run domain without Firebase Hosting buffering.
- [ ] Unauthenticated cURL requests to `/api/llm/*` return `401 Unauthorized` via App Check.
- [ ] Cloud Tasks successfully authenticate to worker routes using OIDC tokens.
- [ ] GCP Log Explorer properly parses JSON severity and trace IDs from the Node.js backend.
- [ ] GitHub Actions successfully builds and pushes the Docker container.
- [ ] Hard quotas are configured in the GCP Console.

## Future Considerations

- Shift React 19 to Firebase App Hosting for SSR once streaming timeout limitations are officially lifted by the GCP team.
