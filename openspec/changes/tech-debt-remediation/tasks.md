# Tasks: Remediation Plan

## Phase 1: Architecture & Queue Consolidation

- [ ] Remove Piscina threads and SharedArrayBuffer implementations in src/workers/kmeansWorker.ts.
- [ ] Implement standard BullMQ workers with hardcoded concurrency (e.g., 5).
- [ ] Replace setInterval polling loops in src/server/queues.ts with native BullMQ scheduled jobs.
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

- [ ] Remove express-async-handler, manual `.safeParse()` checks, and `try/catch` boilerplates across all routes (including `/discover-competitors`) for Express 5 native async bubbling.
- [ ] Implement global Express error handler to catch Zod and 413 Entity Too Large errors.
- [ ] Fix React 19 detached setTimeout inside startTransition in ValidationArena.tsx.
- [ ] Implement nested startTransition for post-await React state updates.

## Phase 4: Testing & Typing Standardization

- [ ] Replace deep firebase-admin mocks with Firebase Emulator in campaignRoutes.test.ts.
- [ ] Configure vitest.setup.ts to randomize Project IDs and use REST API for isolated emulator resets.
- [ ] Replace global.fetch overrides with MSW (Mock Service Worker) in strict mode.
- [ ] Remove 'any' typings in scoringRoutes.ts and resolve detached dynamic imports.
