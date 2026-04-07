# Tasks: Hybrid Data Moat Implementation

## Phase 1: Baseline Tagging & Architecture Setup

- [x] Update `vectorSyncWorker.ts` to include `batch_baseline` provenance tags using `set` with `merge: true` (skipping `demand_score`).
- [x] Create `src/server/routes/nicheRoutes.ts`.
- [x] Set a 24h TTL policy on the `cloud_tasks_payloads` Firestore collection to purge orphaned payloads.
- [x] Mount the new `nicheRoutes` router in `server.ts` at `/api/niche`.

## Phase 2: Cache-Hit First & JIT Two-Phase Fetch

- [x] In `POST /validate-jit`, implement strict Zod (`.strict()`) and prompt injection sanitization (`replace(/[<>]/g, "")`) on `idea` input.
- [x] Implement a Cache-Hit check against `founder_demand_queries` for known massive tarpits to return a sub-second response without hitting LLMs.
- [x] Implement `X-Accel-Buffering: no` SSE streaming with `try/catch` specifically catching and formatting errors as SSE events before `res.end()`.
- [x] Bind `AbortController` to `req.on('close')` to cancel downstream Exa and Gemini operations if the client drops.
- [x] Implement Exa search and Gemini parsing (`gemini-3.1-pro-preview` / `gemini-3.1-flash`) with `zodToJsonSchema` validation and schema drift protection.

## Phase 3: Processing, Claim Check & Cloud Task

- [x] At the end of `/validate-jit` success, write `{ idea, competitors, userId, timestamp }` payload to `cloud_tasks_payloads`.
- [x] Enqueue a Cloud Task to `/api/internal/worker/flywheel-cache-jit` passing only the `payloadDocId`.

## Phase 4: Background Worker & Collision Engine (Distributed Counters)

- [x] Create `workerRouter.post("/flywheel-cache-jit")` endpoint.
- [x] Ensure worker endpoints hold HTTP request open (await `batch.commit()`) before `res.status(200).send()` to guarantee Cloud Run CPU allocation.
- [x] Implement Claim Check idempotency: Retrieve payload by `payloadDocId`. If missing, return 200 (processed). Include payload document deletion in the exact same `WriteBatch`.
- [x] Implement domain normalization logic (lowercase, URL parsing, strip `www.`) for competitor IDs.
- [x] Create WriteBatch logic: Save the raw user query to `founder_demand_queries` (to maintain the bipartite graph).
- [x] Implement Firestore Distributed Counters (shards 0-9) when incrementing `demand_score` on existing competitors to prevent hotspotting.

## Phase 5: Frontend Data Moat Integration

- [x] Refactor `ZeroFrictionEntry` to a single-input (URL or Idea) to show instant market gravity, turning data collection into a requested refinement (Reverse Demo Hook).
- [x] Refactor `PivotSimulator` to persist user pivot acceptances and rejections into a `pivot_decisions` analytics table.
- [x] Add `save_negative_constraint` LLM tool in `InsightEngineChat` for explicit user corrections to the AI.
- [x] Implement optional interaction validation UI in `FounderWorkspace` (e.g., explicitly dismissing insights with reasons).

## Phase 6: Testing & CI Resilience

- [x] Implement Supertest SSE Mocking: Inject a test-only middleware to intercept and ignore the `req.on('close')` event to prevent Supertest from prematurely aborting streams in CI.
- [x] Implement Vitest React Stream Tests: Wrap the initial `render()` and subsequent stream injections in `await act(async () => { ... })` to prevent "suspended inside an act scope" errors.
- [x] Implement Playwright E2E Mocking: Mock SSE responses in `page.route` by fulfilling with concatenated chunks and `Content-Type: text/event-stream`.
- [x] Verify local coverage (`npm run test -- <changed-files> --coverage`) meets >80%.
