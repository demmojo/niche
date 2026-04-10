---
name: Production-Resilience-Phase2
overview: Implements the final production hardening layer for NicheAI, focusing on zero-code secret management, true disaster recovery (PITR + Cold Exports), safe report-only CSP headers, PII-scrubbed error tracking, and non-cascading compute health checks.
todos:
  - id: configure-secret-manager
    content: Map Google Secret Manager secrets directly to Cloud Run environment variables (bypassing volume mounts).
    status: pending
  - id: configure-firestore-dr
    content: Enable Firestore PITR via CLI and create a Cloud Scheduler job for weekly cold-storage exports.
    status: pending
  - id: implement-safe-security-headers
    content: Integrate Helmet with a Report-Only Content Security Policy (CSP) and strict CORS to avoid breaking Firebase Auth and SSE streams.
    status: pending
  - id: integrate-sentry-scrubbed
    content: Initialize Sentry in React and Express with strict beforeSend hooks to scrub PII, auth tokens, and raw LLM prompts.
    status: pending
  - id: implement-shallow-healthz
    content: Create a shallow /healthz endpoint in server.ts for load balancer liveness checks (decoupled from Firestore latency).
    status: pending
isProject: false
dependencies: [production-readiness-pipeline]
---

# OpenSpec Plan: Production Resilience (Phase 2)

**Target File:** `openspec/plans/YYYY-MM-DD-production-resilience-plan.md`

## 1. Executive Summary

Following the initial `production-readiness-pipeline` (which addressed volumetric DoW attacks, caching, and CI/CD), this Phase 2 spec tackles the remaining "Day 2" operational requirements. Based on a rigorous adversarial architecture review, we are implementing Secret Management, Disaster Recovery, Security Headers, Error Tracking, and Uptime Monitoring. Crucially, this plan explicitly avoids common anti-patterns such as deep health checks that cause cascading failures, volume-mounted secrets that break Node.js expectations, and strict CSPs that break React/Firebase integrations.

## 2. Core Features & UX Flow

### A. Zero-Code Secret Management

- **Current State:** `.env` files are used locally and in CI.
- **Target State:** Use Google Secret Manager.
- **Adversarial Mitigation:** We will NOT use volume mounts (which expose secrets as files). Instead, we will bind Secret Manager versions directly to Cloud Run environment variables (`gcloud run deploy --set-secrets`), allowing the existing `process.env` Node.js code to work unmodified and securely.

### B. True Disaster Recovery (Beyond PITR)

- **Current State:** No backup strategy.
- **Target State:**
  1. Enable Firestore Point-in-Time Recovery (PITR) for instant 7-day rollback capability against accidental deletions.
  2. Implement a Cloud Scheduler cron job to trigger a Firestore export to a cold-line Cloud Storage bucket weekly. This satisfies long-term compliance and true Disaster Recovery (DR) beyond the 7-day PITR window.

### C. Safe Security Headers & Strict CORS

- **Current State:** No CSP or strict CORS.
- **Target State:** Implement `helmet` and `cors` in `server.ts`.
- **Adversarial Mitigation:** A strict CSP will instantly break Vite HMR, inline Radix UI styles, and Firebase Auth iframes. We will deploy the CSP in **Report-Only** mode first. Strict CORS will be enforced, whitelisting only the production Firebase Hosting domain.

### D. PII-Scrubbed Active Error Tracking (Sentry)

- **Current State:** Passive structured logging via Pino (from Phase 1).
- **Target State:** Integrate `@sentry/react` and `@sentry/node` for active stack trace aggregation and crash alerting.
- **Adversarial Mitigation:** LLM applications process highly sensitive intellectual property (user startup ideas) and Auth tokens. We must implement Sentry's `beforeSend` hook to aggressively scrub all Authorization headers, IP addresses, and request bodies before transmission.

### E. Non-Cascading Uptime Monitoring

- **Current State:** A basic `/api/health` endpoint exists.
- **Target State:** A standard `/healthz` endpoint monitored by GCP Cloud Monitoring from 3+ geographic regions.
- **Adversarial Mitigation:** The `/healthz` check will be strictly **shallow** (returning 200 OK if the Express event loop is responsive). It will NOT ping Firestore. Deep health checks create a catastrophic failure vector where a minor database latency spike causes the Load Balancer to kill healthy compute instances.

## 3. Technical Implementation Details & Risks

- **Dependencies:** `@sentry/node`, `@sentry/react`, `@sentry/profiling-node`, `helmet`, `cors`.
- **Testing Requirements:**
  - Vitest coverage must remain >95%.
  - Unit tests to verify the Sentry `beforeSend` scrubbing logic.
  - Integration tests for strict CORS rejection.

## 4. Success Criteria

- [ ] No hardcoded API keys exist in the Docker container or Cloud Run configuration (verified via Secret Manager integration).
- [ ] Firestore PITR is active and a weekly export bucket exists with a 90-day lifecycle deletion rule.
- [ ] API responses include `Content-Security-Policy-Report-Only` headers.
- [ ] Sentry captures unhandled Promise rejections without leaking Authorization headers or request body PII.
- [ ] `/healthz` responds in < 5ms under load, without querying the database.
