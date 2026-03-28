# Design: Architecture Remediation

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

- **Queue Management:** Adopt standard BullMQ processors. Dynamically tuning via `os.cpus()` is banned in favor of hardcoded concurrency (e.g., concurrency: 5).
- **Concurrency Safety:** Do not use static/shared `Float32Array` scratchpads for vector math. Instantiate a new `Float32Array(768)` per-request to prevent data corruption.
- **Competitor Discovery Strategy:** Deprecate generative LLM extraction in `/discover-competitors`. Exa's `neural` search is already a semantic retrieval engine. We will map the `similarityScore` via deterministic `gemini-embedding-001` cosine similarity calculations to prevent hallucinated scores and reduce TTV/latency.
- **Express Modernization:** Eliminate manual `try/catch` and `.safeParse()` checks in all routes (including the new ones). Unhandled promise rejections must natively bubble up to an Express 5 global error handler.
- **Testing:** Mandate Firebase Emulator Suite REST API for isolated test resets. Generate a randomized Firebase Project ID per test file.

## Risks & Trade-offs

- Moving frontend transactions to the backend requires immediate client-side refactoring, which may block feature development momentarily.
- Adopting async queues for LLM routes changes the UX flow, necessitating Firestore onSnapshot subscriptions on the client.
