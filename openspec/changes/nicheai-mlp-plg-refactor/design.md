# Design: NicheAI MLP PLG Refactor

## Context

The current "Reverse Demo Hook" is undermined by fragility in state management, streaming, and auth. Our streaming LLM calls are expensive, and dropped connections currently waste resources. We need to harden the perimeter, optimize API utilization via resumeable SSE, and fix critical UX bugs.

## Goals

- Secure endpoints against DoW, Event Loop Starvation, and IDOR.
- Prevent duplicate LLM API costs resulting from background worker / client dual-processing.
- Deliver sub-second token streaming (the "wow" factor) combined with resilient state saving.
- Ensure robust Auth upgrading from anonymous sessions.

## Non-Goals

- Building complex enterprise-grade distributed locks, "Suicide Pacts", or Decoupled Heartbeats. We will rely on standard retries, basic status flags, and structured Abort lifecycles.
- Fully supporting cross-device magic link continuation (downgrading this to a same-device limitation to prioritize OAuth).

## Decisions

1. **Hybrid Streaming Pattern (SSE + Firestore Periodic Flush):**
   We will not duplicate LLM processing. The backend SSE handler executes the single LLM request. Tokens stream to the UI, while the server periodically flushes the aggregated buffer to Firestore (every 3-5 seconds). 
2. **Stateful Resume on Disconnect:**
   If the client disconnects (`req.on('close')`), an `AbortController` terminates the LLM early. A final synchronous commit marks the job `aborted_prematurely` with the partial text. Users can "Resume Generation" later without starting over.
3. **OAuth over Magic Links:**
   Aggressively steer users to standard OAuth (Google/GitHub) for upgrading anonymous accounts. We will use `linkWithCredential` and catch conflicts gracefully.
4. **Two-Phase Fetch:**
   Phase 1 enforces strict payload limits (`100kb`) and uses React 19 `startTransition`. Returns `202 Accepted` + `jobId`. Phase 2 uses the SSE handler.

## Risks/Trade-offs

- **Cross-device magic links** will essentially degrade. Acceptable trade-off to steer toward OAuth and remove the fragile "Auth Session Ledger".
- **Stored XSS** risk from cached markdown generation. Mitigation: Frontend MUST aggressively sanitize the streaming markdown (e.g., DOMPurify) before rendering.