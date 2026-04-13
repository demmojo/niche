# Design: Modern Frontend Streaming Architecture

## Context

The frontend needs a paradigm shift to support the "AI Co-Founder" workflows seamlessly. Relying strictly on simple markdown updates is insufficient. We need architectural clarity separating Developer-Facing architecture (Layout Shells, Disposable JSX) from Run-Time architecture (Vercel AI SDK streaming, AST validation).

## Goals

- Safely render rich Generative UI without hallucination-induced crashes.
- Efficiently process rapid LLM token streams without degrading client performance.
- Secure frontend pipelines against malicious injected code from model outputs.
- Maintain resilient state transitions when the app backgrounded/foregrounded (mobile context).

## Non-Goals

- Manual AbortSignal and cancellation wiring for LLMs (offloaded entirely to Vercel AI SDK).
- Artificial length caps based solely on local parser limitations.
- Strict Container/Presenter over-engineering (embracing Disposable JSX instead).

## Decisions

- **Disposable JSX Pattern:** Limit file sizes to ~400 lines. Extract complex business logic into custom hooks, allowing AI agents to overwrite presentation layers safely.
- **Two-Phase Fetch & AI SDK:** Phase 2 (LLM generation) relies entirely on Vercel AI SDK (`append`/`complete`), avoiding dual state maintenance.
- **Die on Disconnect:** Backgrounded tabs do not block the user with "Processing..." on return. Instead, fetch the final state from Firestore's `updatedAt` field.
- **Explicit State Authority:** Upon tab foregrounding (`visibilitychange`), tear down the Vercel SDK fetch controller to kill zombie TCP connections and rely on Firestore `onSnapshot`.
- **Hard Circuit Breaker:** The backend proxy handles streaming length limits, pushing an error chunk at the tail end if exceeded.

## Risks & Trade-offs

- **Risk:** Dropped streams due to OS clock freezing. **Mitigation:** Implement a "Dead Letter Timeout" that triggers a lightweight `GET /api/generation/{id}/status` deterministic fetch rather than trusting `Date.now()` math.
- **Trade-off:** Markdown parsers are synchronous. **Mitigation:** Implement a decoupled chunk ingestion buffer that yields to the UI every 100-200ms rather than parsing instantly on every micro-SSE chunk.

## Future Potential

Seamlessly expanding into fully dynamic sandboxed React Server Components or generic micro-frontend modules as AI model reliability on component generation increases.
