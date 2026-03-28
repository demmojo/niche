# Design: Architecture Remediation

## Enhancement Summary (Deepened via Research Agents)

**Deepened on:** 2026-03-28
**Research agents used:** `architecture-strategist`, `framework-docs-researcher`, `product-strategist`

### Key Improvements Discovered

1. **Queue Architecture:** Mandate `useWorkerThreads: true` for BullMQ sandboxed processors to avoid "Zombie Worker" loops caused by event loop starvation. Replace `setInterval` with BullMQ repeatable jobs.
2. **Express 5 Error Boundaries:** Ensure the global error handler guards against `ERR_HTTP_HEADERS_SENT` (using `res.headersSent`), explicitly catches `entity.too.large` (413) and `entity.parse.failed` (400), and replaces `.safeParse` with `.parse` to natively bubble `ZodError`s.
3. **Product Strategy (Heuristics First):** The generative LLM in `/discover-competitors` violates the "Anti-Bloat" philosophy. It will be replaced with deterministic Gemini 768D embeddings and synchronous cosine similarity math to calculate match tiers dynamically without hallucination.

## Context

Deep research by architecture subagents identified severe anti-patterns: Piscina threads using C-style shared memory for simple vector math, ~1,100-line 'God' controllers (now exacerbated by a new `/discover-competitors` route), and insecure frontend-driven Firestore transactions.

## Goals

- Simplify workers to standard async BullMQ processors.
- Move heavy LLM generation to an asynchronous '202 Accepted' queue pattern.
- Refactor the recently added `/discover-competitors` route to replace generative hallucinated scoring with deterministic vector similarity heuristics, aligning with the "Anti-Bloat" product vision.
- Extract `fetchExaCompetitors` and prompt logic out of Express endpoints to prevent event-loop timeouts.
- Secure transactions with AuthZ and strictly typed Zod validation (eliminating `any` casting and `.passthrough()`).
- Enforce the new `src/utils/security.ts` sanitizers for all user inputs before LLM ingestion to prevent prompt injection.
- Fix React 19 async tearing and Express 5 error handling.

## Non-Goals

- Prematurely migrating infrastructure to Supabase/Postgres. We will stick to the current Firestore architecture.

## Decisions

- **Queue Management:** Adopt standard BullMQ processors. Dynamically tuning via `os.cpus()` is banned in favor of hardcoded concurrency (e.g., concurrency: 5). Extract inline BullMQ processors (like `network-io-queue` in `queues.ts`) into dedicated sandboxed files using `useWorkerThreads: true` to prevent zombie workers from event loop starvation. Replace `setInterval` polling with BullMQ repeatable jobs.
- **Concurrency Safety:** Do not use static/shared `Float32Array` scratchpads for vector math. Instantiate a new `Float32Array(768)` per-request to prevent data corruption.
- **Competitor Discovery Strategy (Anti-Bloat):** Deprecate generative LLM extraction in `/discover-competitors`. Exa's `neural` search is already a semantic retrieval engine. We will map the `similarityScore` via deterministic `gemini-embedding-001` cosine similarity calculations. We will `Promise.all` embed the Exa results and map the threshold mathematically (e.g., `> 0.85` = Direct, `> 0.70` = Adjacent).
- **Express Modernization:** Eliminate manual `try/catch` and `.safeParse()` checks in all routes (including the new ones). Unhandled promise rejections must natively bubble up to an Express 5 global error handler. The error handler MUST include an `if (res.headersSent) return next(err)` guard.
- **Testing:** Mandate Firebase Emulator Suite REST API for isolated test resets. Generate a randomized Firebase Project ID per test file.

## Risks & Trade-offs

- Moving frontend transactions to the backend requires immediate client-side refactoring, which may block feature development momentarily.
- Adopting async queues for LLM routes changes the UX flow, necessitating Firestore onSnapshot subscriptions on the client.
