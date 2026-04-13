# Consolidated Code Quality & Security Audit Report (Iteration 4)

This report synthesizes the latest findings from the `/architecture-strategist`, `/api-contract-reviewer`, and `/performance-oracle` subagents regarding the `openspec/plans/2026-04-11-ai-native-frontend-workflow-docs.md` document.

---

## 🚨 Critical Architecture & Performance Findings

### 1. Synchronous Main-Thread Blocking (`DOMPurify` Fallacy)

- **Description:** The spec mandates wrapping the markdown renderer in `React.memo` and using `useDeferredValue` to postpone `DOMPurify` HTML sanitization to a low-priority render.
- **Impact:** `useDeferredValue` only delays the _start_ of the render. Because `DOMPurify` is synchronous, once the render starts, it will block the main thread for its entire duration. The assertion that `useDeferredValue` guarantees execution within a 16ms frame budget across all devices is architecturally flawed and will cause severe UI freezing on large generative streams.
- **Remediation:** Remove the assertion that `useDeferredValue` prevents main-thread blocking during synchronous execution. Mandate that heavy HTML sanitization should either be executed in a **Web Worker** or the backend should emit pre-sanitized HTML/Markdown tokens. Alternatively, implement an incremental AST-based parser that only sanitizes the _diff_ ($O(1)$) rather than the entire string ($O(N)$).

### 2. Render Queue Saturation (O(N) Render Calls)

- **Description:** The spec mandates that high-frequency SSE token accumulation stream directly to state using simple functional updaters (e.g., `setTokens(prev => prev + chunk)`), explicitly banning micro-batching.
- **Impact:** Generative LLMs emit chunks at extremely high frequencies (20-50+ tokens per second). Firing a React state setter 50 times per second floods the React concurrent scheduler, burning CPU and battery. Furthermore, `prev + chunk` forces V8 to allocate a new string in memory 50 times a second, causing high Garbage Collection (GC) pressure ($O(N^2)$ memory allocation pattern).
- **Remediation:** Revert the ban on micro-batching. Accumulate the raw string in a mutable `useRef(currentString)` to avoid triggering renders. Use `requestAnimationFrame` or a `100ms` throttle to flush the ref's value to React state. This reduces state updates to a manageable rate without perceivable latency.

### 3. Main-Thread Blocking for Massive JSON Payloads

- **Description:** The doc mandates: "If the frontend must process massive JSON structures, it MUST parse them directly on the main thread using standard `JSON.parse()`... Do NOT mandate Web Workers."
- **Impact:** `JSON.parse()` is a synchronous, blocking operation. Parsing a 5MB+ JSON dataset on the main thread will freeze the UI for 50–200ms depending on device capabilities, causing the exact UI jank the document claims to solve.
- **Remediation:** Establish a payload size threshold. Payloads < 1MB can use main thread `JSON.parse()`. Payloads > 1MB MUST be parsed off-thread via a Web Worker or streamed incrementally using a library like `Oboe.js`.

### 4. Single Point of Failure (SPOF) via Strict Fail-Closed Redis

- **Description:** The spec states: "This check MUST enforce a fail-closed policy (deny access) if the Redis instance is unreachable".
- **Impact:** While this satisfies strict security, it introduces a catastrophic availability risk. A transient Redis network partition or latency spike causes a total global outage for all AI features.
- **Remediation:** Introduce a **Graceful Degradation Circuit Breaker**. If Redis is unreachable (timeout > 500ms), the system should fall back to querying the primary datastore (Firestore) for the user's token revocation status, rather than throwing a hard 500/403.

---

## ⚠️ High/Medium API & Scalability Warnings

### 5. API Contract Breakdown on Legacy Routes (API Contracts)

- **Description:** The plan enforces HTTP 406 Not Acceptable if `Accept` headers are missing, and intercepts 413 PayloadTooLargeErrors globally, coercing them into a new `AppError` format.
- **Impact:** If applied to legacy `/v1/` routes that previously defaulted to JSON or handled 413s differently, these are breaking contract changes.
- **Remediation:** Explicitly scope strict Content-Type Negotiation (406 Not Acceptable) and the `AppError` interceptor exclusively to new `/v2/` routes. Legacy `/v1/` routes must retain their exact historical error shapes and header handling.

### 6. The Colocation vs. Extraction Paradox (Architecture)

- **Description:** Section 2 ("The Colocated Components Reality") explicitly rejects over-engineered abstractions like Container/Presenter, arguing LLMs need colocated UI + state. However, Execution Step 2 mandates: "Inject business logic using the defined **Pure Logic Extraction Boundary**."
- **Impact:** This is a fatal contradiction. You cannot mandate strict colocation (to aid AI code generation) while simultaneously requiring a "Pure Logic Extraction Boundary." This will trap implementation agents in endless refactor loops trying to satisfy both constraints.
- **Remediation:** Remove the phrase "Pure Logic Extraction Boundary" from Execution Step 2. If the thesis is "Colocated Components", embrace it entirely. The boundary should be between the UI component and the API fetch layer, not within the component itself.

### 7. Opaque Error Interfaces vs. Telemetry (Architecture)

- **Description:** Mandating that backend errors map to a sanitized `AppError` interface (e.g., `{ status: 'partial_error', details: string, code: string }`) is excellent for security, but strips stack traces.
- **Impact:** Debugging production SSE stream failures becomes nearly impossible without correlating the opaque UI error with backend logs.
- **Remediation:** The architecture must mandate appending a unique `traceId` to the `AppError` payload, enabling engineers to correlate the UI error with the exact backend logs.

---

**[HITL PAUSE]**

The subagents have completed their review. They discovered severe performance bottlenecks related to React state updates (O(N²) GC thrashing from 50x/sec updates), false assumptions about `useDeferredValue` preventing synchronous main-thread blocking, and a fatal contradiction regarding "Pure Logic Extraction Boundaries" in a "Colocated Component" architecture.

**Do you explicitly approve for me to stop reviewing and begin applying these architectural, performance, and security fixes to the `openspec/plans/2026-04-11-ai-native-frontend-workflow-docs.md` specification?**
