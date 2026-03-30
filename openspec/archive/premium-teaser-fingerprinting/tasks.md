# Tasks

## Phase 1: Fingerprinting Utility

- [x] Implement `generateAnonymousFingerprint` in `src/server/utils/fingerprintUtils.ts` using SHA-256.
- [x] Add logic for a daily rotating salt to ensure GDPR compliance.
- [x] Write unit tests to verify consistency and daily rotation.

## Phase 2: Security & Tracking

- [x] Implement Firestore tracking logic for `anonymous_usage_limits/{fingerprintHash}`.
- [x] Add Firebase App Check enforcement middleware to the teaser API routes.

## Phase 3: Endpoint Upgrades

- [x] Update `/api/scoring/stream` to use `gemini-3.1-pro-preview` and `exa.searchAndContents` for anonymous users.
- [x] Integrate the fingerprint generator and Firestore limit checks into the endpoint logic.
- [x] Implement 429 Too Many Requests response handling when the limit is exceeded.
