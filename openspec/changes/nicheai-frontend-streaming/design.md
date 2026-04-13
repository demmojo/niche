# Design: Frontend Infrastructure & Generative UI

## Context

The 2026 AI ecosystem requires strict separation between human-authored foundational logic and AI-authored disposable code. Current manual orchestration of streaming state natively in React triggers severe rendering cascades and XSS vulnerabilities during AST parsing.

## Goals

- Support rich Generative UI without text-only limitations.
- Prevent main-thread locking during high-throughput token streaming.
- Eliminate XSS vectors from raw, hallucinated JSX payloads.
- Centralize workflow constraints into local `.cursor/prompts`.

## Non-Goals

- Over-engineering human abstractions like strict Container/Presenter patterns.
- Creating manual `AbortSignal` checks for the internal Vercel AI SDK stream phases.
- Using local client-side timestamps for stream timeouts.

## Decisions

1. **Disposable JSX Pattern:** Limit component files to ~400 lines. Extract business logic into colocated hooks (`useFeatureX.ts`) with a flat destructurable signature. JSX becomes disposable.
2. **Foundational Layout Shells:** Enforce static, human-owned parent containers (`<AsymmetricalShell>`) that import AI-generated children.
3. **Decoupled Chunk Ingestion:** Buffer SSE chunks and yield UI updates every 100-200ms rather than pushing every microscopic chunk directly into the AST parser.
4. **Die on Disconnect:** Streams interrupted by backgrounding/disconnects will drop local state authority and rely on a definitive backend fetch/Firestore ledger on re-foregrounding.

## Compatibility & Migration Strategy

- **Backward Compatibility:** This refactor is designed to be fully additive and non-disruptive to existing, non-streaming routes. The new streaming primitives (`<GenerativeErrorBoundary>`, chunk ingestion throttler) will be implemented as isolated higher-order components (HOCs) or hooks (`useStreamingProtocol`).
- **Migration Path:** We will roll out the new streaming architecture progressively. Legacy components will continue to function via the standard REST endpoints while we update specific views (e.g., the `RoastMyNiche` component) to opt-in to the Vercel AI SDK `useCompletion` or custom buffered `useStream` hooks.
- **Rollback:** The foundational Layout Shells will allow us to easily toggle between the old `children` prop and the new AI-generated `children` if issues arise.

## Risks/Trade-offs

- **Concurrent Yield Fallacy:** React 19 defers the DOM commit, but synchronous AST parsing still blocks rendering. _Mitigation:_ The decoupled chunk ingestion buffer throttles UI updates.
- **Zombie TCP Connections:** SDK fetch controllers left hanging in the background. _Mitigation:_ `visibilitychange` listeners tear down the controller upon tab foregrounding and resync with Firestore.

## Future Potential

Establishing this robust AST and stream handler lays the foundation for fully autonomous generative routing and extensive UI multi-agent systems.
