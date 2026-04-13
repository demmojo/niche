---
title: Refactor: NicheAI Modern Frontend Streaming Architecture
status: draft
dependencies: [core-api-hardening]
refactors: []
---

# Proposal: Refactor NicheAI Modern Frontend Infrastructure & Workflow Docs

## Context & Objective

As the AI-native development ecosystem evolves in 2026, the primary challenge for frontend engineering is avoiding the homogenization of design ("AI Slop") and preventing severe UI fragility when handling massive generative streams, while enabling rich Generative UI capabilities.

This OpenSpec explicitly mandates a core **Frontend Infrastructure Refactor** to support a new AI-native workflow. While it updates our `README.md` and `.cursor/prompts` to combat AI Slop, the majority of the execution tasks detail the requisite architectural rewrite: implementing robust React 19 concurrent streaming primitives, isolating Generative UI state from render cascades, supporting dynamic interactive components, and securing the AST markdown rendering pipeline.

## Strategic Alignment & Architectural Philosophy

- **The Core Local Workflow:** Centralize constraints into local `.cursor/prompts` to guide local IDE agents.
- **Logic Isolation (The Disposable JSX Pattern):** Reject over-engineering human abstractions (like strict Container/Presenter). Maintain a complexity heuristic of ~400 lines of code per file. When a component exceeds this, extract business logic into a colocated hook (e.g., `useFeatureX.ts`) with a flat, explicitly destructurable signature so the presentational JSX layer remains disposable and regeneratable by AI.
- **Generative UI Empowerment:** Move beyond text-only limitations. The architecture must explicitly support the safe streaming of interactive UI components (e.g., via the Vercel AI SDK's `toolUI` patterns or sandboxed React Server Components) to empower the "AI Co-Founder" to deliver dynamic interactive value.

## Execution Tasks

- [ ] **Task 1: Component Scaffolding & Visual Thesis**
  - Rely strictly on simple, inline markdown instructions within `.cursorrules` to guide local LLM behavior.
  - **Architectural Clarity:** Separate Developer-Facing (Build-Time) architecture (Layout Shells, Disposable JSX, `.cursor/prompts`) from End-User-Facing (Run-Time) architecture (Vercel AI SDK, AST sanitization) to prevent paradigm confusion.
  - Require a `<design_system_mapping>` block. Enforce the use of **foundational Layout Shells** (e.g., `<AsymmetricalShell>`) that are static, human-owned parent containers in the React tree. **Physical Boundary:** Layout shells must be human-owned parent files that statically `import` the AI-generated disposable child components.
  - **Generative UI Support:** Rather than strictly locking the LLM to standard markdown, implement Vercel AI SDK UI tools to stream structured dynamic components securely. The LLM invokes tools, and the frontend maps tool calls to safe, pre-registered React components, eliminating the XSS risk of raw hallucinated JSX while preserving rich interactivity.
  - **Network Control Plane:** Completely remove `AbortSignal` and cancellation wiring from the LLM's generation scope. Render the "Cancel" button outside of the LLM-generated AST boundary.
  - Implement the **Two-Phase Fetch Strategy** using **Explainable States**. Phase 2 (the LLM call) MUST use the Vercel AI SDK's `append` or `complete` methods to stream invisibly into a secondary channel. Do not build manual React state setters or manual `AbortSignal` checks for Phase 2, as the SDK handles the stream state internally.

- [ ] **Task 2: Logic Wiring & Bimodal State Management**
  - Wire `useActionState` for forms and React 19 AbortControllers for fetch requests.
  - **Stream Resilience & UX:** Enforce the "Die on Disconnect" mandate for standard generations. When a user returns to a backgrounded mobile tab, the UI MUST NOT render a hostage "Processing/Syncing..." blocking overlay. Instead, fetch the completed state from the backend (relying on a standard Firestore `updatedAt` timestamp or document version integer, completely avoiding complex cryptographic parity checks) and render a non-blocking background sync toast, allowing the user to navigate the app freely. **Backend Contract:** The backend architecture must be explicitly defined to support this. If the backend aborts the LLM on client disconnect, the frontend must handle an "interrupted" state, not a "completed" state.
  - **Zombie TCP Connection Cleanup:** Add a `visibilitychange` listener. Upon foregrounding the app, if a stream was active, explicitly tear down the SDK's fetch controller to kill any zombie TCP connections and hand over state authority entirely to the Firestore `onSnapshot` listener.
  - **State Rehydration Boundary:** When the Firestore `onSnapshot` resolves with a completed generation after a disconnect, the frontend must explicitly call the Vercel AI SDK's internal setters (e.g., `setMessages`) to overwrite the local disconnected state with the canonical backend ledger. Do not maintain two separate UI states.
  - **Split-Brain Dead Letter Alignment:** Implement a "Dead Letter Timeout" on the frontend. **Crucially**, do NOT rely on local client time math (`Date.now()`) which is vulnerable to OS clock freezing. Upon `visibilitychange` (tab foregrounding), if a stream is marked active locally, the client MUST make a lightweight deterministic fetch to the backend (e.g., `GET /api/generation/{id}/status`) to definitively confirm if the job is dead or completed, rather than guessing based on local timestamps.
  - **Split React Contexts:** Strictly split React Contexts (separating state and dispatch) for global providers.
  - **Context Bailout:** Explicitly forbid Zustand or Context for generative state entirely. Let the Vercel AI SDK own the stream state natively (`useChat` / `useCompletion`).

- [ ] **Task 3: Concurrent Rendering Optimization & Native Streaming Primitives**
  - **The Streaming Abstraction:** Leverage industry-standard streaming libraries (Vercel AI SDK `useChat` / `useCompletion`).
  - **Addressing the Concurrent Yield Fallacy:** React 19 concurrent features defer the DOM commit, but synchronous AST Markdown parsing still blocks the render phase. To handle large documents without locking the main thread, implement a **decoupled chunk ingestion buffer** that throttles UI updates to React state (yielding updates only every 100ms or 200ms) rather than pushing every microscopic SSE chunk into the AST parser instantly. Virtually window completed markdown blocks.
  - **Hard Circuit Breaker:** The _backend streaming proxy_ MUST enforce a hard byte/token circuit breaker that actively terminates the pipeline if the stream exceeds the budgeted length, replacing the tail with an error chunk, rather than trusting the LLM to stop. Do not artificially cap product capabilities based on parser limitations, but protect the infrastructure from runaway LLM hallucinations.

- [ ] **Task 4: Generative Stream Hook Encapsulation**
  - Wrap the SDK's primitives in a domain-specific custom hook (e.g., `useNicheGenerativeStream`).
  - **Zero-Trust Mid-Stream Validation:** Any custom payloads received via the Vercel SDK `data` stream MUST be validated against a strict Zod schema using `.safeParse()`. **Crucially:** The `useEffect` parsing the `data` stream MUST maintain a "high-water mark" index tracker (e.g., via `useRef`) to ensure it only processes _new_ chunks. If a payload packet fails validation (e.g., due to a hallucinated comma), explicitly drop the malformed packet, silently swallow the error to avoid crashing the effect loop, log the error, and gracefully continue the stream. Do NOT crash the entire expensive generation session over a single malformed packet.
  - **Security Guardrail (Partial Render Crash):** Wrap the streaming renderer component inside a dedicated React Error Boundary (e.g., `<GenerativeErrorBoundary>`).

- [ ] **Task 5: AST Rendering and Main-Thread Optimizations**
  - Rely strictly on the AST-based markdown renderer (`react-markdown`). Manage paint costs via standard concurrent rendering and `content-visibility`.
  - **Security Guardrail (XSS Defense):** Mandate a `urlTransform` function utilizing a strict **allowlist** approach (explicitly allowing only `http:`, `https:`, and `mailto:` protocols) to sanitize all generated links and images, rather than attempting to strip specific malicious protocols.
  - **Component Injection & Node Filtering:** Explicitly mandate filtering of dangerous HTML node types (e.g., stripping `<script>`, `<iframe>`, `<object>`, and potentially unsafe `<svg>` nodes) at the AST level via `rehype-sanitize`. Block `data:` and `blob:` URIs.
  - Limit JS-based virtual windowing (e.g., `@tanstack/react-virtual`) strictly to completed historical chat messages/turns where the height is static. NEVER attempt to virtualize the actively streaming markdown chunk.

- [ ] **Task 6: Intent Validation & Coverage Reporting**
  - Frame functional UI validations as manual component-level simulations using React Testing Library.
  - Frame full End-to-End simulations using Playwright E2E Test Mode, relying exclusively on Firebase Auth Emulators or mock auth via Playwright's network interception.
  - **Streaming Test Mocks:** For Vitest, ensure the initial `render()` and every `controller.enqueue()` are wrapped in `await act(async () => { ... })`. For Playwright, mock SSE in `page.route` by fulfilling the request with a single concatenated string of chunks.

- [ ] **Task 7: Documentation Updates**
  - Update `README.md` to integrate this new pipeline.
  - Update `AGENTS.md` with the documented boundaries.
