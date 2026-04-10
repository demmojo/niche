# Design: Production Readiness Pipeline

## Context

The existing NicheAI stack (Express 5.x, React 19, Firebase) is functionally complete but lacks production safeguards. State is managed locally, deployments are manual, and SSE streams risk being broken by CDN intermediaries.

## Goals

- Ensure application availability under volumetric attack.
- Prevent massive API bills via strict cutoffs.
- Implement reliable, structured observability.
- Standardize CI/CD.

## Non-Goals

- Deploying a Redis cluster (violates scale-to-zero serverless philosophy).
- Implementing React 19 Server-Side Rendering (deferred).

## Decisions

1. **Cloud Armor over Redis**: Introducing a stateful Redis cluster creates fail-open risks that multiply DoW attack surfaces across scaled instances. Cloud Armor drops malicious traffic at the edge before waking containers.
2. **Direct Cloud Run Routing for API**: We will NOT proxy `/api/**` through Firebase Hosting rewrites. Firebase Hosting buffers requests and enforces a 60-second timeout, which kills SSE LLM streaming. Frontend will communicate directly with the Cloud Run domain.
3. **Hard Quotas over Budget Webhooks**: GCP Budget Alerts can be delayed by hours. Volumetric attacks could drain funds before a webhook fires. Hard daily quotas instantly stop API access.
4. **App Check & OIDC Segregation**: Public requests will use Firebase App Check. Internal machine-to-machine traffic (Cloud Tasks) will use Google OIDC JWTs to prevent friendly fire blocks.

## Risks/Trade-offs

- Direct Cloud Run communication requires strict CORS configurations.
- Hard quotas may disrupt service for legitimate users if usage spikes organically.

## Future Potential

- Shift React 19 to Firebase App Hosting for SSR once streaming timeout limitations are officially lifted by GCP.
