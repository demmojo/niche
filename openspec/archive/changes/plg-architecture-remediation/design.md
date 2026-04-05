# Design: PLG Architecture & Rate Limit Remediation

## Context

The PLG Teaser and anonymous workflows are designed to bring in top-of-funnel traffic. However, the exact scenario these features were built to support (a viral spike) will currently crash the system due to Firestore write contention. Parallel to this, temporary network drops are being mishandled, and Human-In-The-Loop (HITL) curation allows users to accidentally break their own campaigns.

## Goals

- Prevent database contention bottlenecks by moving high-frequency writes to Redis.
- Ensure safe, maintainable access to Firebase Auth tokens.
- Prevent empty arrays from reaching campaign generation logic.

## Non-Goals

- Refactoring the entire HitL curation process.
- Moving fully authenticated tier rate limits to Redis (scope is limited to global anonymous limits for now).

## Decisions

- **Redis vs. Firestore Distributed Counters:** Use Redis (since it's already in the stack for BullMQ) with a 24-hour TTL for the `global:anon:limit:YYYY-MM-DD` key. It guarantees extreme performance. If Redis isn't provisioned yet in a specific environment, a Firestore Distributed Counter sharded across 10-20 docs will be used as a fallback.
- **Exponential Backoff:** Use standard network-level retries for `fetchWithAppCheck` rather than piercing internal SDK properties. If a token is legitimately expired and network is fine, it should fail gracefully (401) rather than force-read an expired internal token.
- **Validation Strategy:** Implement dual-layer validation. UI disables submission and guides the user, while the backend API strictly rejects bad payloads using Zod.

## Risks & Trade-offs

- **Redis Dependency:** Relying on Redis for synchronous API requests introduces a hard dependency on Redis uptime. If Redis goes down, anonymous requests might fail or bypass limits. We will implement a fail-open or fail-closed strategy depending on environment config.

## Future Potential

- Expand Redis rate limiting to user-specific authenticated limits, allowing granular tiered API usage plans without increasing Firestore costs.
