# Design: Production Resilience (Phase 2)

## Context

Based on a rigorous adversarial architecture review, we are implementing Day 2 operational features. We must explicitly avoid common anti-patterns such as deep health checks that cause cascading failures, volume-mounted secrets that break Node.js expectations, and strict CSPs that break React/Firebase integrations.

## Goals

- Secure secrets injection without refactoring existing Node.js code.
- Implement comprehensive disaster recovery (PITR + cold backups).
- Gain active crash alerting without exposing PII or intellectual property.
- Ensure compute instances remain stable during database latency spikes.

## Non-Goals

- Implementing a strict, blocking Content Security Policy (CSP) at this stage.
- Deep health checks verifying downstream database connectivity.

## Decisions

1. **Environment Variable Binding:** We will NOT use volume mounts for secrets, avoiding exposed files. We will bind Secret Manager versions directly to Cloud Run environment variables (`gcloud run deploy --set-secrets`).
2. **Report-Only CSP:** A strict CSP will instantly break Vite HMR, inline Radix UI styles, and Firebase Auth iframes. We will deploy the CSP in **Report-Only** mode first.
3. **Aggressive Sentry Scrubbing:** Implement Sentry's `beforeSend` hook to aggressively scrub all Authorization headers, IP addresses, and request bodies before transmission.
4. **Shallow Health Checks:** The `/healthz` check will return 200 OK if the Express event loop is responsive. It will NOT ping Firestore.

## Risks/Trade-offs

- **Report-Only CSP:** Leaves us temporarily vulnerable to XSS until we transition to enforcing mode, but prevents catastrophic outage of core UI components.
- **Shallow Healthz:** Load balancers might send traffic to an instance that cannot reach the database. However, this trade-off prevents a minor database latency spike from tricking the LB into killing completely healthy compute instances (cascading failure).

## Future Potential

Analyze CSP violation reports to iteratively tighten rules and eventually move from Report-Only to strict enforcement.
