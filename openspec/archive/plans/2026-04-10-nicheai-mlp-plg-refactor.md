---
title: NicheAI MLP PLG Refactor
status: draft
author: Product Strategist
date: 2026-04-10
dependencies: ["superadmin-pipeline-gtm"]
---

# Proposal: NicheAI MLP PLG Refactor

## Why

The current NicheAI MLP implementation suffers from architectural vulnerabilities, UX friction, and security gaps that undermine the "Reverse Demo Hook" PLG strategy. Specifically, we have identified Denial of Wallet (DoW) risks on global rate limits, offline UI freezes for superadmins, "ghost auth" cross-device failures with Magic Links, and generic "AI slop" aesthetics that erode trust.

## What Changes

This refactor overhauls the frontend PLG flow and hardens the backend architecture to support secure, scalable, and high-fidelity user experiences. It shifts global rate-limiting to robust counters combined with Edge-level protection, implements secure Firebase Magic Links with cross-device persistence and email-bound report claiming, hardens Server-Sent Events (SSE) with bifurcated `AbortController` lifecycles, and completely revamps the UI to enforce "Explainable States" and ban generic AI aesthetics.

## Capabilities

### Modified Capabilities

- `roast-my-niche-entry`:
  - **Rate Limiting:** Replaced single-document rate limiting with Tenant-scoped Firestore Distributed Counters. _Adversarial Guard (DoW):_ To prevent Denial of Wallet, add IP-based Cloudflare WAF / GCP Cloud Armor L7 rate-limiting before the request hits Cloud Run. Include a `BYPASS_ANONYMOUS_LIMITS` flag for local DX.
  - **Two-Phase Fetch & Cloud Tasks:** Implement a Two-Phase Fetch. Phase 1 executes ultra-fast deterministic logic and immediately returns a `202 Accepted` with a `jobId`. _Adversarial Guard (Payload DOS):_ Phase 1 MUST enforce `express.json({ limit: '100kb' })` to prevent Event Loop Starvation. Phase 1 must be wrapped in React 19 `startTransition`. Phase 2 is dispatched to the background Worker Endpoint. _Adversarial Guard (Unauthenticated Worker):_ The Worker Endpoint MUST require IAM authentication, and Cloud Tasks MUST attach an OIDC token.
  - **Abort Lifecycle & Cascade Prevention:** Decoupled waitlist logic and integrated AbortControllers. _Adversarial Guard (IDOR):_ The `/cancel` endpoint MUST verify that the authenticated user owns the `jobId` before mutating the ledger. The background Worker MUST maintain an active `onSnapshot` listener on this ledger document, which triggers `ac.abort()` on the Gemini `AbortController` if the status changes to aborted. The Worker MUST explicitly call `unsubscribe()` on the listener before returning `200 OK`. _Adversarial Guard (Container Crash & Exhaustion):_ To prevent Container Crashes via Unhandled AbortError, the top-level Worker MUST wrap Phase 2 in a global try/catch that safely returns `200 OK` on `AbortError`. To prevent a Resource Exhaustion Cascade on deterministic failures, Cloud Tasks MUST enforce a strict retry limit (e.g., max 3 retries) with a Dead Letter Queue (DLQ).
- `secure-report-delivery`:
  - **Auth Persistence:** Rip out the cross-device Magic Link "Auth Session Ledger" trap. Rely strictly on standard OAuth (Google/GitHub) via `linkWithPopup` for upgrading anonymous users. *Migration Path:* For existing users, retain basic Same-Device Magic Link support as a legacy fallback, but aggressively steer users toward OAuth in the UI. If Magic Links are required, accept the limitation that they must be opened on the same device/browser.
  - **Auth Token Resilience:** Wrap `getIdToken()` in a `try...catch` with exponential backoff and a strict 5-second circuit breaker. Use `linkWithCredential` (e.g., `OAuthProvider.credentialFromError`) to cleanly resolve `auth/credential-already-in-use` conflicts smoothly during anonymous account upgrades.
- `my-reports-dashboard`:
  - Redesigned with a master-detail/accordion layout, dark mode theme, explicit "Explainable States" (`aria-live="polite"`), and visibility for 'pending' reports. Generic "AI slop" aesthetics (like generic spinners) are strictly banned.
- `superadmin-queue`:
  - Fixed offline UI freeze by ordering state updates before `setDoc` merges and optimizing React 19 concurrent rendering.
- `stateful-resume-backend`:
  - **Worker Resilience:** Rely on standard Cloud Tasks retries and basic Firestore status flags (`status: "pending" | "processing" | "completed" | "error"`). Strip out enterprise-grade distractions like "Suicide Pacts", "Decoupled Heartbeats", and complex lock-stealing logic. Phase 2 (LLM) outputs are cached in `generations/{jobId}`. _Adversarial Guard (Access Controls & Prompt Injection):_ Firestore Security Rules MUST restrict the `generations` collection strictly to the authenticated `owner_uid`. User inputs passed to Exa and LLMs MUST be sanitized to mitigate Prompt Injection.
  - **Hybrid Streaming Pattern (SSE + Cloud Tasks):** To preserve the "wow" factor of the Reverse Demo Hook, the primary delivery mechanism MUST be Server-Sent Events (SSE) streaming sub-second tokens directly to the UI. However, to guarantee resilience against disconnects and Cloud Run CPU throttling, we CANNOT run the LLM twice (once on the web server, once in background) as that doubles API costs. Instead, the backend SSE handler executes the single LLM request. As tokens stream back to the user, the server ALSO periodically flushes the aggregated buffer to Firestore (every 3-5 seconds). If the client disconnects prematurely, a `finally` block or `req.on('close')` hook enqueues a quick Cloud Task with the *partial* completion state to cleanly update the ledger. This preserves UX without duplicating LLM processing costs. _Adversarial Guard (Stored XSS):_ The frontend MUST aggressively sanitize the streaming markdown (e.g., DOMPurify) before rendering to prevent Stored XSS.

## Architectural Guardrails

### 1. Hybrid Two-Phase Fetch & Streaming Implementation

To preserve immediate gratification while ensuring resilience during long-running LLM processes:

- **The Initial Payload (Phase 1):** Performs ultra-fast deterministic internal validation, writes the initial Firestore ledger (`status: "pending"`), and returns a `202 Accepted` containing the unique `jobId`. Exa search and LLM generation belong strictly in Phase 2.
- **React 19 Integration:** The fetch must be triggered inside `startTransition` boundaries. The frontend then establishes an SSE connection to initiate Phase 2 for instant token rendering.
- **The Handoff & UI Updates (Phase 2):** The UI drives its primary display via the SSE stream. The backend SSE handler executes the LLM call and simultaneously updates the document's `status` field in Firestore (e.g., "searching_exa", "analyzing") and incrementally saves the token buffer every 3 seconds. If the user navigates away and returns later, the UI fetches the cached state from the Firestore ledger instead of re-initiating the stream, drastically cutting LLM API costs.

### 2. Hybrid Streaming: SSE Happy Path + Firestore Resilience

This addresses the need for sub-second UI updates (the "wow" factor) while mitigating orphaned reports caused by Cloud Run CPU throttling on disconnects.

- **The Reverse Demo Hook Requirement:** We CANNOT rely solely on Firestore for streaming because it restricts document updates to 1 write/second, creating a clunky UX. We MUST use Server-Sent Events (SSE) for the happy path.
- **Architectural Solution (Cost-Optimized MLP Design):**
  1. **Happy Path (SSE):** The UI hits the Phase 1 endpoint for validation, then connects to Phase 2 via SSE. The Phase 2 endpoint single-threads the heavy LLM logic.
  2. **Resilience (Chunking):** As tokens stream to the UI, the Phase 2 handler periodically (every 3 seconds) flushes the accumulated buffer to Firestore. This acts as a stateful ledger.
  3. **Disconnect Handling:** If the SSE connection drops (`req.on('close')`), an `AbortController` cleanly terminates the LLM generation early to save costs. It performs one final synchronous commit to Firestore marking the job as `status: "aborted_prematurely"` with the partial text.
  4. **Stateful Resume:** When the user returns, the UI reads the partial state. A "Resume Generation" button initiates a new Phase 2 call, passing the partial text so the LLM simply continues where it left off, avoiding duplicate token generation.

## Impact

This impacts the public entry point (`/roast-my-niche`), the authenticated user dashboard (`/my-reports`), the superadmin queue (`/admin/pending-roasts`), and the core LLM streaming backend (`src/server/sse.ts`, `src/server/llmRoutes.ts`). It extends the `superadmin-pipeline-gtm` spec.
