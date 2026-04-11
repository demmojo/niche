# Research Findings: Low-Level Implementation Details for PLG Refactor

As the `best-practices-researcher` and `framework-docs-researcher`, I have reviewed the `2026-04-10-ripcord-audit-gate.md` (NicheAI MLP PLG Refactor) against modern best practices for React 19, Firebase, Cloud Run, and Node.js SSE streams.

I've identified critical missing low-level implementation details that must be addressed before architectural execution.

## 1. Two-Phase Fetch Implementation

**The Gap:** The plan mentions Phase 1 (fast data) and Phase 2 (background LLM) but lacks the mechanism for bridging these phases without breaking React 19 concurrent features or causing "ghost updates" on unmounted components.

**Low-Level Details Needed:**

- **The Initial Payload:** Phase 1 must return a `202 Accepted` containing both the fast deterministic data (e.g., Exa results) AND a unique `jobId`.
- **React 19 Integration:** The Phase 1 fetch must be triggered inside `startTransition` or `useActionState` to keep the UI responsive.
- **The Handoff:** The frontend immediately renders the Phase 1 data, then initiates a secondary mechanism for Phase 2. To avoid the "Double-Hit Latency Penalty" and adhere to `AGENTS.md`, the backend must cache this intermediate state in the `generations/{jobId}` Firestore document so Phase 2 (the worker) doesn't re-run Phase 1.
- **The Stream:** Phase 2 should stream updates either via a dedicated SSE endpoint that consumes the `jobId` OR via Firestore `onSnapshot`. If using `onSnapshot`, we must ensure React 19 `use()` unwraps the stream chunks correctly.

## 2. Context Splitting (React 19)

**The Gap:** The plan demands "Context Splitting (state vs. dispatch) to prevent render cascades," but lacks the React 19-specific API definitions for how this interacts with `use()`.

**Low-Level Details Needed:**

- **Separate Providers:** We must instantiate two distinct contexts: `const StateContext = createContext<State | null>(null)` and `const DispatchContext = createContext<Dispatch | null>(null)`.
- **Memoization:** Inside the parent provider, the state value and the dispatch object (or setter function) MUST be independently wrapped in `useMemo` and `useCallback`.
- **Consumption:** Child components that trigger actions but do not need to observe state (e.g., a 'Cancel' button) must explicitly use React 19's `use(DispatchContext)`. This completely isolates them from the render cascades triggered when `StateContext` updates during high-frequency SSE chunking.

## 3. SSE `AbortController` Detachment & Cloud Run Throttling (Critical Risk)

**The Gap:** The plan states: _"SSE AbortControllers must be detached once a generation reaches the PQL Gate."_ This is physically impossible in a naive Node.js/Cloud Run setup and risks systemic failure.

**Low-Level Details Needed:**

- **Node.js Limitation:** You cannot dynamically "un-pass" an `AbortSignal` from an already in-flight `fetch` or `@google/genai` request. The detachment must be implemented as a logical gate inside the socket close listener:
  ```typescript
  req.on("close", () => {
    if (!generation.hasReachedPQLGate) {
      abortController.abort(); // Cancel LLM to save cost
    }
    // If past the gate, we deliberately do NOT call .abort()
  });
  ```
- **Cloud Run CPU Throttling (The Silent Killer):** Even if we logically skip `.abort()`, when the user's mobile browser drops the connection, the HTTP request ends. Unless the Cloud Run service is explicitly configured for "CPU always allocated" (which is expensive), the instance's CPU will be throttled to near-zero immediately after the response closes. The background LLM Promise will freeze, and the PQL report will become an orphaned zombie.
- **Architectural Solution (The Claim Check Pattern):**
  To safely achieve PQL Detachment, the heavy LLM work CANNOT run in the same HTTP process as the SSE stream.
  1. The UI hits an endpoint that dispatches a Cloud Task to a **Worker Endpoint** and returns a `jobId`.
  2. The Worker Endpoint holds its own independent HTTP connection to Cloud Tasks, guaranteeing CPU allocation.
  3. The UI connects to a lightweight SSE endpoint (or uses `onSnapshot`) that merely _tails_ the Firestore document.
  4. If the UI disconnects, the SSE tail drops. The Worker Endpoint is unaffected and finishes the PQL report.
  5. To abort _before_ the PQL Gate, the UI must hit a `/cancel` endpoint that flips a `status: "aborted"` flag in Firestore, which the Worker Endpoint actively checks during its generation loop.

**Recommendation:** Pass these findings directly to the Architecture Strategist to update the OpenSpec plan. The "Claim Check" pattern is an absolute requirement for the PQL Detachment to survive Cloud Run infrastructure constraints.
