## Synthesized Technical Audit Report (RESOLVED)

### Correctness Bugs & State Management Flaws

**Critical: Buffered Chunk Loss During Mid-Stream Errors**

- **Description:** If a failure occurs mid-stream, the stream's `onclose` handler and the throttle callback check if the state is `Error` and skip `setState` if true. This prevents the final flush of valid chunks received since the last throttle tick, discarding partial data.
- **Resolution:** Updated the architecture. The `event: error` handler MUST synchronously flush any remaining data in the `useRef` buffer to the Client UI state _before_ or _alongside_ the transition to the `Error` state to guarantee no partial data is lost.

**Critical: Markdown AST Memoization Assumes Monotonic Stream Parsing**

- **Description:** The plan mandates memoizing completed markdown paragraphs to optimize Client UI rendering. However, markdown parsing is non-monotonic; appending new tokens (like closing a code block or emphasis) can retroactively alter the boundaries of preceding text. Rigid memoization based on partial text will cause broken UI.
- **Resolution:** Removed the mandate for paragraph-level `memoization` virtualization. Defaulting to standard concurrent rendering and `content-visibility` to manage paint costs without breaking AST parsing.

**Warning: Throttling Mechanism Contradicts Framerate Requirements**

- **Description:** The architecture specifies using `requestAnimationFrame` to sync with vsync, but also specifies throttling state updates to 66ms (15fps). `requestAnimationFrame` fires at the display's native refresh rate (16ms or 8ms), meaning it will fail to mitigate GC thrashing unless explicitly paired with a delta-time accumulator.
- **Resolution:** Consolidated the rules. Explicitly mandated that if `requestAnimationFrame` is used for throttling, it MUST track `performance.now()` delta times and only trigger the Client UI `setState` flush when `delta >= 66ms`.

**Note: Missing Error/Empty States in Initial Scaffolding**

- **Description:** The plan restricts initial LLM scaffolding to ONLY 'Success' and 'Loading' states. When the error handling logic correctly transitions the component to `Error` or `Cancelled`, the UI will crash or render blank screens because the states do not exist in the scaffolded markup.
- **Resolution:** Updated Task 1 to explicitly include `Error`, `Empty`, and `Partial/Cancelled` states in the initial UI scaffolding requirements.

---

### Maintainability Issues & Technical Debt

**Critical: Dead Code and Bifurcated Naming (`fetchLegacy`)**

- **Description:** Maintaining a backward-compatibility shim (`fetchLegacy`) alongside the modern fetcher (`fetchV2`) introduces permanent technical debt and bimodal logic in a "Modern Frontend Stack" refactor. The name `fetchLegacy` describes age rather than behavior, leading to confusion.
- **Resolution:** Removed `fetchLegacy` entirely. Instructed developers to explicitly export domain-specific wrappers (e.g., `fetchV2`) and adapt legacy API responses at the API client/service boundary instead of polluting Client UI components or global network utilities.

**Warning: Architectural Bloat via Competing Virtualization Strategies**

- **Description:** The document layers three overlapping virtualization strategies for markdown rendering: `memoization`, CSS `content-visibility: auto`, and JS-based `@tanstack/virtual-scroller`. Combining CSS DOM virtualization with JS-based virtual windowing on the same elements causes layout measurement conflicts and architectural bloat.
- **Resolution:** Dictated a single, mutually exclusive abstraction boundary: use `content-visibility` for standard documents, and switch _exclusively_ to `@tanstack/virtual-scroller` for infinite scrolling histories. Added explicit rule NEVER to mix them.

---

### Security Vulnerabilities & Risk Reduction

**Critical: Auth Bypass via `mock_auth` in Production**

- **Description:** The plan mandates appending `?mock_auth=true` to URLs to bypass Firebase Auth for E2E testing. If the client-side logic checks this parameter without verifying the deployment environment, an attacker could append this query string in production to bypass authentication and expose restricted UI routes.
- **Resolution:** Added a strict mandate that any `mock_auth` parameter parsing MUST be strictly gated behind an environment check (e.g., `process.env.NODE_ENV !== 'production'`) and rely on bundler Dead Code Elimination (DCE) to strip this testing backdoor from production bundles.

**Critical: Client-Side Resource Exhaustion (Memory DoS) via Unbounded Streams**

- **Description:** The "Deferred Render Pattern" concatenates incoming SSE chunks into a hidden `useRef` string. If an attacker manipulates the LLM into an infinite repetition loop, the hidden string will grow unbounded, eventually triggering runtime Garbage Collection failures and crashing the browser tab.
- **Resolution:** Added a strict byte/character limit (circuit breaker) mandate inside the network loop. If the accumulated bytes exceed a safe threshold, the hook MUST forcefully abort the stream to prevent OOM crashes.

**Warning: XSS via AST Markdown Rendering (`javascript:` URIs)**

- **Description:** While relying on `markdown-parser` is safer than `dangerouslySetInnerHTML`, the AST parser can still render malicious `javascript:` URIs in link `href` or image `src` attributes generated by the LLM.
- **Resolution:** Explicitly mandated that a `urlTransform` function (or equivalent URI sanitizer) MUST be active in the markdown renderer to strip `javascript:` and `vbscript:` protocols from all generated links and images.

**Note: Data Leakage in Local State Managers**

- **Description:** Offloading high-frequency updates to atomic state managers (like Zustand) introduces the risk of developers using persistence middlewares (e.g., `zustand/middleware/persist`). This would write sensitive generative AI outputs or PII in plaintext to the browser's `localStorage` or `IndexedDB`.
- **Resolution:** Added a specific architectural constraint in Task 2 forbidding the persistence of generative UI state slices to local storage; they must remain in-memory only.

## Security Mandate

Legacy payloads containing any CRLF sequences MUST trigger an immediate HTTP 400 rejection across all implementations to prevent HTTP Response Splitting.
