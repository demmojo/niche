# Design: Core API Hardening

## Context

The infrastructure requires high resilience against modern attack vectors without falling into over-engineered enterprise patterns that degrade operability or introduce distributed DoS vectors.

## Goals

- Harden Node.js API, streaming endpoints, and authentication boundaries.
- Maintain an MLP philosophy (lean constraints over complex features).
- Maintain high availability, fail-safe mechanisms, and stateless auth.

## Non-Goals

- Maintaining complex custom Redis JWT revocation blocklists.
- Legacy backward compatibility for API contracts.
- Over-engineered SNI TLS spoofing for SSRF defenses.

## Decisions

- **Lean API Contracts:** Break contracts explicitly instead of maintaining backwards compatibility; mandate Zod `.strip()` DTOs.
- **Fail-Safe Availability:** Rely on short-lived JWTs (15 min) and offline stateless signature validation instead of fragile revocation lists.
- **Protocol Security:** Require strictly JSON-encoded Server-Sent Events (SSE) to mathematically prevent CRLF protocol injection.

## Risks/Trade-offs

- **Token Persistence:** Rejecting Redis blocklists risks up to 15-minute token persistence upon revocation but avoids failing-open DoS vulnerabilities.
- **Availability Drop:** Fail-closed circuit breakers for rate limiting may reject requests during Redis outages but protect Cloud Run from massive distributed DoS vectors.
