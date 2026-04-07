# Design: Architecture & Technical Strategy

## Context

The platform faces technical debt that disrupts the user journey: Vite SSR `admin12.firestore` crashes, destructive Firestore writes overwriting sibling fields, OAuth redirect data loss (due to relying on volatile client memory), crawler blocks (Cloudflare 403s), and unauthenticated SSE endpoints vulnerable to abuse and SSRF.

## Goals

- Fix Vite SSR module interop for `firebase-admin`.
- Guarantee data integrity during workspace upserts and Auth migrations.
- Protect external integrations (Exa, Gemini) from financial exhaustion.
- Maintain UX flow even when external crawlers fail.

## Non-Goals

- Full replacement of Firebase/Firestore.
- Complete overhaul of the frontend styling (focusing only on radar chart visualizations and UX copy overhauls).

## Decisions

1. **Module Interop:** Add `firebase-admin` to `ssr.external` in `vite.config.ts` and refactor to deep modular imports.
2. **ZeroFrictionEntry Data Integrity:** Use Firestore `writeBatch` with `{ merge: true }` for atomic upserts. Enforce ownership immutability via strict cryptographic Firestore Security Rules on both create and update operations.
3. **Backend Claim-Check Pattern:** To fix Auth Collision orphans, anonymous users will persist a secure `claimToken` and `anonUid` to `localStorage` and Firestore prior to OAuth. Post-login, a Cloud Function (`migrateWorkspace`) securely merges subcollections into the permanent workspace as a secondary workspace.
4. **Data Provenance & Crawler Fallbacks:** Wrap Exa calls in `try/catch`. On failure, emit a `fallback_triggered` SSE event, utilize an LLM 'Heuristic Mode' to synthesize competitors, inject a native UI input for exact URLs, and tag data with `provenance: 'heuristic_inference'` to prevent ground-truth poisoning.
5. **SSE Lifecycle & Security:** Bind `req.on('close')` to an `AbortController` to kill expensive Gemini/Exa calls instantly on disconnect. Enforce IP-based rate limiting pre-PQL. Implement SSRF blocks on `/api/scoring/url-teaser` rejecting all RFC 1918 IPs.

## Risks & Trade-offs

- **Complexity in Auth Handoff:** The Claim-Check pattern requires careful async transaction management in the Cloud Function to avoid race conditions.
- **Heuristic Mode Accuracy:** LLM hallucinated competitors might degrade trust; this is mitigated by explicitly tagging provenance and immediately asking the user for direct competitor URLs.

## Future Potential

The Claim-Check pattern establishes a robust framework for handling multi-device anonymous sessions or guest-to-team invites in the future.
