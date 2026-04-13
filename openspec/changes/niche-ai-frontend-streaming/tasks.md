# Tasks

## Phase 1: Component Scaffolding & Visual Thesis

- [ ] Update `.cursorrules` and `.cursor/prompts` to enforce the Disposable JSX pattern and Layout Shells usage.
- [ ] Create foundational static Layout Shells (e.g., `<AsymmetricalShell>`).
- [ ] Implement Vercel AI SDK UI tools to map function calls to pre-registered interactive UI components.
- [ ] Render the standard generation cancellation controls completely outside of the LLM-generated AST boundary.
- [ ] Scaffold Phase 1 & 2 fetch methods ensuring Phase 2 utilizes `append` or `complete` without custom `AbortSignal` checks.

## Phase 2: Logic Wiring & Bimodal State Management

- [ ] Wire `useActionState` and React 19 `AbortControllers` for data fetching.
- [ ] Implement "Die on Disconnect" UX pattern alongside `visibilitychange` listener for foreground tab zombie TCP cleanup.
- [ ] Sync final state gracefully from Firestore `onSnapshot` via Vercel AI SDK's setter (`setMessages`) post-disconnect.
- [ ] Create frontend "Dead Letter Timeout" logic using a deterministic backend `GET` fetch instead of local `Date.now()` math.
- [ ] Split React Contexts to strictly separate state and dispatch; explicitly exclude Vercel AI streaming states from Context providers.

## Phase 3: Concurrent Rendering & Generative Hooks

- [ ] Build `useNicheGenerativeStream` custom hook wrapping standard Vercel AI SDK primitives.
- [ ] Implement a decoupled chunk ingestion buffer (100-200ms throttle timer) to yield render phase for fast streams.
- [ ] Enforce Zero-Trust Mid-Stream Validation: attach strict Zod `.safeParse()` validation to `data` stream packet processing.
- [ ] Wrap the generative payload and rendering component within a dedicated `<GenerativeErrorBoundary>`.

## Phase 4: AST Rendering & Security Guardrails

- [ ] Integrate `react-markdown` ensuring synchronous rendering avoids global main-thread lock (thanks to chunk buffer).
- [ ] Implement `urlTransform` allowlist sanitization (only `http:`, `https:`, `mailto:`).
- [ ] Hook up `rehype-sanitize` to strip `<script>`, `<iframe>`, `<object>`, `<svg>`, and bad URIs (`data:`, `blob:`).
- [ ] Configure virtual windowing strictly for completed chat components via `@tanstack/react-virtual` (skip active chunks).

## Phase 5: Validation, Legacy Support, & Docs

- [ ] Implement React Testing Library mocks and Playwright mock SSE chunk string injections.
- [ ] Add graceful degradation styles/divs for legacy interactive widgets.
- [ ] Create `/v2/generation` API endpoints to maintain backward compatibility during rollout.
- [ ] Update `README.md` and `AGENTS.md` with boundary constraints and pipeline structures.
