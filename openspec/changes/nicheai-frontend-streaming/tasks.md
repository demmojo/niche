# Execution Tasks

## Phase 1: Architecture & Scaffolding

- [x] Scaffold `.cursorrules` and `.cursor/prompts` to centralize constraints.
- [x] Implement static foundational Layout Shells (e.g., `<AsymmetricalShell>`).
- [ ] Configure Vercel AI SDK `toolUI` mapping to pre-registered React components.
- [x] Strip local `AbortSignal` and manual cancellation wiring from the generation scope.
- [x] Setup Two-Phase Fetch Strategy and Explainable States.

## Phase 2: State Management & Stream Resiliency

- [ ] Wire `useActionState` and React 19 AbortControllers for standard fetch requests.
- [ ] Implement "Die on Disconnect" workflow with Firestore ledger syncing.
- [x] Add `visibilitychange` listener to cleanup zombie TCP connections and reset the SDK fetch controller.
- [ ] Establish "Dead Letter Timeout" utilizing a deterministic backend fetch upon foregrounding.
- [x] Split global React Contexts (separate state and dispatch); ban Context for generative streams.

## Phase 3: Optimizations & Encapsulation

- [x] Build decoupled chunk ingestion buffer (throttle state updates to 100-200ms intervals).
- [x] Encapsulate stream primitives into `useNicheGenerativeStream` hook.
- [x] Implement `useRef` "high-water mark" index tracker for `data` streams.
- [x] Apply Zod validation payload parsing; configure graceful failure for malformed chunks.
- [x] Wrap the streaming renderer inside a `<GenerativeErrorBoundary>`.

## Phase 4: AST Security & Validation

- [x] Implement `react-markdown` AST pipeline with `rehype-sanitize` explicitly filtering dangerous HTML nodes.
- [x] Write `urlTransform` to strictly enforce `http:`, `https:`, and `mailto:` allowlists.
- [ ] Restrict `@tanstack/react-virtual` to strictly historical chat messages.
- [x] Setup React Testing Library E2E mocks (Vitest `await act()` for SSE chunks).
- [ ] Update `README.md` and `AGENTS.md` to document the new pipeline and component boundary paradigms.
