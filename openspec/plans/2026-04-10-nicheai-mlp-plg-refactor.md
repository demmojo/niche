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
  - **Auth Persistence:** Upgraded from simple email capture to robust Firebase Magic Links (Email Link Auth). Implement the "Auth Session Ledger Pattern": the desktop maintains a real-time `onSnapshot` listener on `auth_sessions/{session_id}`. _Adversarial Guard (Predictable Sessions & Fixation):_ The `session_id` MUST be a cryptographically secure UUID (`crypto.randomUUID()`), and the desktop MUST force a fresh Anonymous Auth sign-in or strictly rotate the UUID on every request to prevent Session Fixation. _Adversarial Guard (Token Theft Vulnerability):_ The session ledger is stamped with `owner_uid: anonymous_uid`, locking Firestore security rules to prevent email scanners from stealing the Custom Auth Token. _Adversarial Guard (Token Leak & TOCTOU):_ The session ledger MUST enforce a strict Firestore TTL, and Custom Auth Tokens MUST use Transactional consumption and short expiration to prevent TOCTOU exploitation.
  - **Auth Token Resilience:** Wrap `getIdToken()` in a `try...catch` with exponential backoff and a strict 5-second circuit breaker. Use `linkWithCredential` to resolve conflicts smoothly.
  - **Orphan Prevention & Report Injection:** Desktop polling assumes the tab stays open. _Adversarial Guard (Report Injection):_ To prevent Report Injection via Unverified Email Stamping, the generation document MUST be stamped with a `pendingEmail` _before_ the magic link is sent, but Firestore Security Rules MUST strictly deny read access until the `owner_uid` matches the fully verified permanent account. This guarantees aggressive reassignment upon verification without leaking reports to unverified attackers.
- `my-reports-dashboard`:
  - Redesigned with a master-detail/accordion layout, dark mode theme, explicit "Explainable States" (`aria-live="polite"`), and visibility for 'pending' reports. Generic "AI slop" aesthetics (like generic spinners) are strictly banned.
- `superadmin-queue`:
  - Fixed offline UI freeze by ordering state updates before `setDoc` merges and optimizing React 19 concurrent rendering.
- `stateful-resume-backend`:
  - **Zombie Worker Protection:** _Adversarial Hardening:_ The `State-Machine Ledger` (`status`, `workerId`, `lockedAt`, `claimCheckPath`) must implement a `lockTimeout`. _Adversarial Guard (Zombie Cost-Multiplexer):_ If a worker hangs, Cloud Tasks automated retries must be allowed to steal the lock. To prevent interlaced billing, the Worker MUST use a **Decoupled Heartbeat** (a detached `setInterval` updating `lockedAt: Date.now()`, independent of LLM chunk yields) to prevent lock theft during long LLM "thinking" phases. This allows a tight 15-second `lockTimeout`. Furthermore, the worker enforces a **Suicide Pact**: chunk writes use Preconditions or Transactions to verify `workerId` ownership; if the lock was stolen, the original worker MUST immediately call `ac.abort()` and kill itself. Phase 2 (LLM) is cached in `generations/{jobId}` so it doesn't re-run Phase 1 on resume. _Adversarial Guard (Access Controls & Prompt Injection):_ Firestore Security Rules MUST restrict the `generations` collection strictly to the authenticated `ownerEmail`/`owner_uid`. Furthermore, user inputs passed to Exa and LLMs in Phase 2 MUST be sanitized to mitigate Prompt Injection.
  - **Cloud Tasks Worker Pattern (PQL Detachment & The Streaming Fallacy):** _Adversarial Hardening:_ Cloud Run CPU throttling kills background promises when a client disconnects. Therefore, heavy LLM work CANNOT run in the SSE HTTP process. The worker logic must run via a Cloud Task hitting a dedicated Worker Endpoint. Furthermore, to avoid the **Firestore Streaming Fallacy** (Firestore limits to 1 write/sec, LLMs stream 50 chunks/sec), the Worker will NOT stream token-by-token to Firestore. Instead, the Worker uses a **Batch-Chunking Strategy**: it updates the ledger with discrete Explainable States (e.g., `status: "analyzing"`, `status: "drafting_report"`) and writes the accumulated text buffer using Inline Backpressured Flushing (instead of a detached `setInterval`) every 2-3 seconds via `setDoc(..., { merge: true })`. This preserves the high-fidelity streaming UX within Firestore's limits, completely eliminating the need for an SSE endpoint or Redis pub/sub. _Adversarial Guard (Stored XSS):_ The frontend MUST aggressively sanitize the batch-chunked markdown (e.g., DOMPurify) before rendering to prevent Stored XSS from hallucinated or injected HTML.

## Architectural Guardrails

### 1. Two-Phase Fetch Implementation

To prevent UI hanging during long-running LLM processes, we will implement a Two-Phase Fetch pattern:

- **The Initial Payload:** Phase 1 performs ultra-fast deterministic internal validation (schema, auth, rate limits), writes the initial Firestore ledger (`status: "pending"`), dispatches the Cloud Task, and returns a `202 Accepted` containing the unique `jobId`. Exa search and LLM generation belong strictly in Phase 2.
- **React 19 Integration:** The Phase 1 fetch must be triggered inside correct React 19 `startTransition` boundaries or `useActionState` to keep the UI responsive during the transition. Furthermore, the frontend MUST ensure correct `useEffect` teardown for the `onSnapshot` listeners to prevent memory leaks and state updates on unmounted components.
- **The Handoff & UI Updates:** The frontend immediately renders shimmers based on the Phase 1 `jobId`. The UI sets up a Firestore `onSnapshot` listener on the ledger document. The Worker (Phase 2) updates the document's `status` field (e.g., "searching_exa", "analyzing") to drive the UI's Explainable States, and uses a Batch-Chunking Strategy to write the accumulated text buffer every 2-3 seconds, replacing the shimmers incrementally.

### 2. Firestore `onSnapshot` Detachment & Cloud Run Throttling

This addresses the critical risk of orphaned reports caused by Cloud Run CPU throttling when mobile browsers disconnect, and the Firestore Streaming Fallacy.

- **Node.js Limitation:** You cannot dynamically "un-pass" an `AbortSignal` from an already in-flight `fetch` or `@google/genai` request.
- **Cloud Run CPU Throttling (The Silent Killer):** If the UI holds an SSE connection to Cloud Run, and the user's mobile browser drops the connection, the HTTP request ends. Unless the Cloud Run service is explicitly configured for "CPU always allocated" (cost-prohibitive), the instance's CPU will be throttled to near-zero immediately. The background LLM Promise will freeze, and the PQL report will become an orphaned zombie.
- **The Firestore Streaming Fallacy:** We cannot use a background Worker to stream tokens to the UI via Firestore, because Firestore restricts document updates to 1 write/second, while LLMs yield ~50 chunks/second.
- **Architectural Solution (Deterministic MLP Design):** To safely achieve PQL Detachment without complex infrastructure (like Redis):
  1. The UI hits Phase 1, which dispatches a Cloud Task to a **Worker Endpoint** and returns a `jobId`.
  2. The Worker Endpoint holds its own independent HTTP connection to Cloud Tasks, guaranteeing CPU allocation regardless of the UI's connection state.
  3. The UI abandons SSE entirely and instead uses `onSnapshot` to tail the Firestore ledger document.
  4. The Worker updates the Firestore ledger at a low frequency (<1 write/sec) with coarse "Explainable States" (e.g., `status: "analyzing"`, `status: "drafting"`). To update the UI's shimmers, it uses a Batch-Chunking Strategy with Inline Backpressured Flushing (instead of a detached `setInterval`) to write the accumulated text buffer every 2-3 seconds. _Adversarial Guard (Phase Transition Clobbering):_ To prevent overwriting a `status: "aborted"` event triggered by the UI, ALL status transitions (including the final "completed" write) MUST use `runTransaction` to abort if `doc.status === 'aborted'`. The chunk interval writes MUST NOT assert the `status` field, or must similarly use transactions/preconditions.
  5. To abort _before_ the PQL Gate, the UI hits a `/cancel` endpoint that updates the Firestore ledger to `status: "aborted"`.
  6. **The Abort Listener & Retry Loop:** The Worker Endpoint maintains its own `onSnapshot` listener on the ledger document. If it detects `status === "aborted"`, it triggers its `AbortController` to kill the Gemini fetch, decoupling cancellation from the HTTP request lifecycle. _Adversarial Guard (Retry Loop of Death):_ Killing the Gemini fetch throws `DOMException: AbortError`. The Worker MUST explicitly catch this error and return `200 OK` to the Cloud Tasks dispatcher to gracefully terminate the queue lifecycle, preventing infinite retries of a canceled job. The Worker MUST also explicitly call `unsubscribe()` on the listener before returning `200 OK` to prevent memory leaks in Cloud Run.

## Impact

This impacts the public entry point (`/roast-my-niche`), the authenticated user dashboard (`/my-reports`), the superadmin queue (`/admin/pending-roasts`), and the core LLM streaming backend (`src/server/sse.ts`, `src/server/llmRoutes.ts`). It extends the `superadmin-pipeline-gtm` spec.
