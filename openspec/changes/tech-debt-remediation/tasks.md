# Tasks: Remediation Plan

## Phase 1: Architecture & Queue Consolidation

- [ ] Remove Piscina threads and SharedArrayBuffer implementations in src/workers/kmeansWorker.ts.
- [ ] Refactor inline BullMQ workers (e.g. `network-io-queue` in `queues.ts`) into dedicated sandboxed processors in `src/server/workers/`.
- [ ] Enforce `useWorkerThreads: true` and hardcoded concurrency (e.g. 5) on all BullMQ workers to prevent zombie worker event loop starvation.
- [ ] Replace setInterval polling loops in src/server/queues.ts with native BullMQ repeatable scheduled jobs.
- [ ] Remove premature Supabase/Postgres references in distillationQueue.

## Phase 2: API & Controller De-fatting

- [ ] Extract LLM, Market Intelligence, and Vector Math logic from src/server/campaignRoutes.ts into separate modules.
- [ ] Refactor the new `/discover-competitors` route: remove generative LLM extraction and replace with deterministic Exa search + Gemini 768D embedding cosine similarity to adhere to "Heuristics First".
- [ ] Move `fetchExaCompetitors` logic to a dedicated `marketIntelligence.ts` service and remove dynamic imports in the hot path.
- [ ] Refactor `CampaignRequestSchema` and `DiscoverCompetitorsRequestSchema` to remove `any` casting and use strict Zod `discriminatedUnion` or `.superRefine()`.
- [ ] Integrate the new `src/utils/security.ts` utilities to sanitize `baseIdea` string inputs against prompt injection before any LLM or embedding calls.
- [ ] Remove synchronous fetch calls in src/server/authMiddleware.ts (rogue telemetry).
- [ ] Move Firestore runTransaction logic from React frontend to secure backend API endpoints.
- [ ] Implement AuthZ boundaries and Zod schema validation on all backend transaction payloads.
- [ ] Fix Vector Math module to instantiate Float32Array(768) per-request.

## Phase 3: Framework Modernization

- [ ] Remove express-async-handler, manual `.safeParse()` checks, and `try/catch` boilerplates across all routes (including `/discover-competitors`) for Express 5 native async bubbling. Let `.parse()` throw `ZodError`s up to the global error handler.
- [ ] Implement global Express error handler to catch `err instanceof z.ZodError` and map to 400.
- [ ] Explicitly catch `err.type === 'entity.too.large'` (413) and `entity.parse.failed` (400) in the global error handler. Ensure an `if (res.headersSent) return next(err)` guard prevents crash loops.
- [ ] Fix React 19 detached setTimeout inside startTransition in ValidationArena.tsx.
- [ ] Implement nested startTransition for post-await React state updates.

## Phase 4: Testing & Typing Standardization

- [ ] Replace deep firebase-admin mocks with Firebase Emulator in campaignRoutes.test.ts.
- [ ] Configure vitest.setup.ts to randomize Project IDs and use REST API for isolated emulator resets.
- [ ] Replace global.fetch overrides with MSW (Mock Service Worker) in strict mode.
- [ ] Remove 'any' typings in scoringRoutes.ts and resolve detached dynamic imports.
