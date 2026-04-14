# Proposal: NicheAI MLP PLG Refactor

## Why

The current NicheAI MLP implementation suffers from architectural vulnerabilities, UX friction, and security gaps that undermine the "Reverse Demo Hook" PLG strategy. Specifically, we have identified Denial of Wallet (DoW) risks on global rate limits, offline UI freezes for superadmins, "ghost auth" cross-device failures with Magic Links, and generic "AI slop" aesthetics that erode trust.

## What Changes

This refactor overhauls the frontend PLG flow and hardens the backend architecture to support secure, scalable, and high-fidelity user experiences. It shifts global rate-limiting to robust counters combined with Edge-level protection, implements secure OAuth and same-device Firebase Magic Links, hardens Server-Sent Events (SSE) with bifurcated `AbortController` lifecycles, and completely revamps the UI to enforce "Explainable States" and ban generic AI aesthetics.

## Capabilities

- **Roast My Niche Entry:** Implements atomic Redis `INCR` and `EXPIRE` commands for high-performance rate limits, isolated per hashed IP or Anonymous UID, entirely replacing contention-heavy Firestore sharded counters. Introduces a True Decoupled Execution (Claim-Check) Fetch where Phase 1 does fast deterministic validation, _synchronously writes the initial job to Firestore_, awaits the dispatch of a deterministic Google Cloud Task (`tasks/{jobId}`), and returns `202 Accepted`. Phase 2 is purely an SSE observation layer listening to a fast-ephemeral Redis Singleton Multiplexed Subscriber for sub-second chunks, while Firestore acts as the persistent ledger. The claim-check state machine is standardized entirely on the `jobs` collection. Quota errors natively trigger `402 Payment Required` to initiate the Reverse Demo Hook upgrade UI.
- **Secure Report Delivery:** Rips out the cross-device Magic Link trap and complex IDOR-prone bulk UID reassignment logic, migrating to standard OAuth via `linkWithPopup` and resolving credential-in-use conflicts via `signInWithCredential` as the bulletproof upgrade path.
- **My Reports Dashboard:** Introduces a master-detail/accordion layout with a dark mode theme, explicit "Explainable States", and strict removal of generic "AI slop" loading aesthetics. It leverages React 19 `useDeferredValue` for smooth DOM updates and uses the 24-hour anonymous TTL as an urgency driver via a persistent countdown banner.
- **Superadmin Queue:** Fixes offline UI freezes via strictly ordered state updates and optimized React 19 concurrent rendering.
- **Stateful Worker Backend:** Drops over-engineered lock-stealing logic in favor of a dedicated Cloud Run worker executing the LLM, streaming to a Redis Singleton Multiplexed Subscriber (using `EventEmitter` to fan-out to SSE clients) to prevent socket exhaustion, and flushing to Firestore every 3-5s for persistence. Disconnects NO LONGER abort the LLM, guaranteeing delivery of the "Reverse Demo Hook" even if the user navigates away. The SSE observer cleanly unsubscribes on disconnect. Mid-stream cancellation is optimized to mitigate polling read-amplification.

## Impact

This impacts the public entry point (`/roast-my-niche`), the authenticated user dashboard (`/my-reports`), the superadmin queue (`/admin/pending-roasts`), and the core LLM streaming backend (`src/server/sse.ts`, `src/server/llmRoutes.ts`). It explicitly extends the `superadmin-pipeline-gtm` spec.
