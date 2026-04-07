# Tasks: Implementation Plan

## Phase 1: Foundational Backend & Security Fixes

- [ ] Fix `firebase-admin` Vite SSR imports via `vite.config.ts` (`ssr.external`) and implement modular imports.
- [ ] Fix ZeroFriction data loss bug by implementing `writeBatch` atomically with `merge: true`.
- [ ] Deploy updated explicit Create/Update Security Rules enforcing ownership immutability cryptographically.
- [ ] Implement IP-based rate limits for unauthenticated SSE endpoints (Redis or Cloud Armor pre-PQL).
- [ ] Add SSRF protection blocking local, loopback, and private IPs (RFC 1918) for URL extraction.
- [ ] Bind backend `req.on('close')` to an `AbortController` to instantly teardown expensive SSE processing.

## Phase 2: Auth Collisions & Migrations

- [ ] Implement Backend Claim-Check pattern for Auth Collisions (save `claimToken` to Anon workspace and persistent local storage).
- [ ] Build Cloud Function `migrateWorkspace({ anonUid, claimToken })` using admin privileges for secure subcollection merging.
- [ ] Ensure merged workspaces append as secondary workspaces to avoid high-friction prompts.

## Phase 3: Fallbacks & Provenance

- [ ] Wrap Exa calls in `try/catch` to handle network blocks (e.g., Cloudflare 403s).
- [ ] Implement `fallback_triggered` SSE event handler.
- [ ] Build collaborative UI fallback injecting a native input field for direct URL drops.
- [ ] Implement Data Provenance tagging (`provenance: 'heuristic_inference'`) in Firestore.

## Phase 4: Intent Handling & PLG UX

- [ ] Replace markdown walls with Explainable AI visualizations (Radar Charts, Defensibility Radars).
- [ ] Configure Tarpit UX (guided pivot flow giving least viable free, best match gated behind PQL).
- [ ] Suppress `[SYSTEM OVERRIDE]` tags and replace with expert copy.
- [ ] Draft and execute intent-based tests covering validation, analysis, and Auth Collision journeys.
