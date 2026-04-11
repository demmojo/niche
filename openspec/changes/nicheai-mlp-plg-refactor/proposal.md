# Proposal: NicheAI MLP PLG Refactor

## Why

The current NicheAI MLP implementation suffers from architectural vulnerabilities, UX friction, and security gaps that undermine the "Reverse Demo Hook" PLG strategy. Specifically, we have identified Denial of Wallet (DoW) risks on global rate limits, offline UI freezes for superadmins, "ghost auth" cross-device failures with Magic Links, and generic "AI slop" aesthetics that erode trust.

## What Changes

This refactor overhauls the frontend PLG flow and hardens the backend architecture to support secure, scalable, and high-fidelity user experiences. It shifts global rate-limiting to robust counters combined with Edge-level protection, implements secure OAuth and same-device Firebase Magic Links with email-bound report claiming, hardens Server-Sent Events (SSE) with bifurcated `AbortController` lifecycles, and completely revamps the UI to enforce "Explainable States" and ban generic AI aesthetics.

## Capabilities

- **Roast My Niche Entry:** Implements Tenant-scoped Firestore Distributed Counters with Edge-level DoW protection. Introduces a Two-Phase Fetch where Phase 1 does fast deterministic validation (returning `202 Accepted`) and Phase 2 leverages an authenticated worker/SSE stream protected by IDOR and crash-resilient `AbortController` boundaries.
- **Secure Report Delivery:** Rips out the cross-device Magic Link trap, migrating to standard OAuth via `linkWithPopup` and resolving credential-in-use conflicts. Retains simple Same-Device Magic Links only as a fallback.
- **My Reports Dashboard:** Introduces a master-detail/accordion layout with a dark mode theme, explicit "Explainable States", and strict removal of generic "AI slop" loading aesthetics.
- **Superadmin Queue:** Fixes offline UI freezes via strictly ordered state updates and optimized React 19 concurrent rendering.
- **Stateful Resume Backend:** Drops over-engineered lock-stealing logic in favor of a Hybrid Streaming Pattern using SSE for sub-second UI updates and periodic Firestore flushing. Disconnects cleanly abort the LLM to save costs, saving partial state for "resume" functionality.

## Impact

This impacts the public entry point (`/roast-my-niche`), the authenticated user dashboard (`/my-reports`), the superadmin queue (`/admin/pending-roasts`), and the core LLM streaming backend (`src/server/sse.ts`, `src/server/llmRoutes.ts`). It explicitly extends the `superadmin-pipeline-gtm` spec.