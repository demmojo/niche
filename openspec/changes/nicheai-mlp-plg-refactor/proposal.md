# Proposal: NicheAI MLP PLG Refactor

## Why

The current NicheAI MLP implementation suffers from architectural vulnerabilities, UX friction, and security gaps that undermine the "Reverse Demo Hook" PLG strategy. Specifically, we have identified Denial of Wallet (DoW) risks on global rate limits, offline UI freezes for superadmins, "ghost auth" cross-device failures with Magic Links, and generic "AI slop" aesthetics that erode trust.

## What Changes

This refactor overhauls the frontend PLG flow and hardens the backend architecture to support secure, scalable, and high-fidelity user experiences. It shifts global rate-limiting to robust counters combined with Edge-level protection, implements secure OAuth and same-device Firebase Magic Links with email-bound report claiming, hardens Server-Sent Events (SSE) with bifurcated `AbortController` lifecycles, and completely revamps the UI to enforce "Explainable States" and ban generic AI aesthetics.

## Capabilities

- **Roast My Niche Entry:** Implements time-bucketed Firestore Transactions for rate limits, isolated per hashed IP or Anonymous UID. Introduces a True Decoupled Execution (Claim-Check) Fetch where Phase 1 does fast deterministic validation, _synchronously writes the initial job to Firestore_, dispatches a Google Cloud Task, and returns `202 Accepted`. Phase 2 is purely an SSE observation layer listening to a fast-ephemeral Redis/PubSub channel for sub-second chunks, while Firestore acts as the persistent ledger. The claim-check state machine is standardized entirely on the `jobs` collection.
- **Secure Report Delivery:** Rips out the cross-device Magic Link trap, migrating to standard OAuth via `linkWithPopup` and resolving credential-in-use conflicts. A backend hook cleanly reassigns `owner_uid` on all `jobs` during anonymous-to-existing-account upgrades to prevent orphaned reports.
- **My Reports Dashboard:** Introduces a master-detail/accordion layout with a dark mode theme, explicit "Explainable States", and strict removal of generic "AI slop" loading aesthetics. It leverages the 24-hour anonymous TTL as an urgency driver via a persistent countdown banner.
- **Superadmin Queue:** Fixes offline UI freezes via strictly ordered state updates and optimized React 19 concurrent rendering.
- **Stateful Worker Backend:** Drops over-engineered lock-stealing logic in favor of a dedicated Cloud Run worker executing the LLM, streaming to Redis for instant UX, and flushing to Firestore every 3-5s for persistence. Disconnects NO LONGER abort the LLM, guaranteeing delivery of the "Reverse Demo Hook" even if the user navigates away. The SSE observer cleanly unsubscribes on disconnect.

## Impact

This impacts the public entry point (`/roast-my-niche`), the authenticated user dashboard (`/my-reports`), the superadmin queue (`/admin/pending-roasts`), and the core LLM streaming backend (`src/server/sse.ts`, `src/server/llmRoutes.ts`). It explicitly extends the `superadmin-pipeline-gtm` spec.
