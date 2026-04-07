---
todos:
  - id: tag-offline-baseline
    content: Update vectorSyncWorker.ts to include batch_baseline provenance tags
  - id: create-jit-route
    content: Create nicheRoutes.ts with the POST /validate-jit endpoint using Two-Phase Fetch (SSE)
  - id: implement-jit-parsing
    content: Implement Exa search and Gemini parsing in the JIT route with AbortController and Claim Check
  - id: implement-collision-engine
    content: Create the Cloud Tasks worker endpoint for async caching and the Collision Engine
  - id: frontend-data-capture
    content: Refactor ZeroFrictionEntry and PivotSimulator to persist user pivot decisions and AI corrections
  - id: frontend-telemetry-ui
    content: Introduce Binary Triage (chips) and Interaction Validation (drag-and-drop/focus points) in FounderWorkspace
  - id: data-perimeter-staging
    content: Implement Zod/DOMPurify validation and a tarpit_queries_staging layer to prevent model poisoning
  - id: mount-niche-route
    content: Mount the new nicheRoutes router in server.ts
  - id: enforce-openspec
    content: Move this plan to openspec/plans/ and run the OpenSpec DAG workflow
---

# Hybrid Data Moat Architecture (JIT Flywheel)

## Overview

This plan implements a hybrid data moat for NicheAI. It decouples the offline 100k BigQuery baseline, tags it with data provenance, and introduces a JIT (Just-In-Time) flywheel.

To preserve the "Reverse Demo Hook" PLG motion, it uses a **Two-Phase Fetch (SSE)** strategy so the UI doesn't hang on LLM generation. Asynchronous ML tagging and collision tracking are safely delegated to GCP Cloud Tasks using the **Claim Check Pattern** to avoid 100KB limits, and batch retries to handle Firestore hotspotting. Furthermore, the frontend is structured to natively capture high-fidelity proprietary data (pivots, manual corrections, binary feedback) while rigorously rejecting garbage inputs.

## 1. Decouple and Tag the Offline Baseline

- **File:** `src/server/workers/vectorSyncWorker.ts`
- **Change:** Add `provenance` metadata to offline inserts. To prevent overwriting organic `demand_score`s gathered from JIT queries, we use a `set` with `merge: true` and avoid hardcoding `demand_score: 0`.
- **Implementation detail:**
  ```typescript
  const updateData = {
    // ... existing fields
    provenance: { source: "batch_baseline" },
    last_batch_sync_at: FieldValue.serverTimestamp(),
  };
  // batch.set(ref, updateData, { merge: true });
  ```

## 2. Build the JIT "Hot Path" Route (Two-Phase Fetch via SSE)

- **File:** `src/server/routes/nicheRoutes.ts` (New File)
- **Change:** Create the `POST /validate-jit` endpoint.
- **Workflow:**
  1. Validate user input (`idea`) via Zod and sanitize prompt injection (`idea.replace(/[<>]/g, "")`).
  2. Bind an `AbortController` to `req.on('close')` to cancel downstream expensive operations if the user disconnects.
  3. Open an SSE stream (`res.setHeader("X-Accel-Buffering", "no")`).
  4. Trigger `Exa.search` (fast deterministic data, <2s) and stream initial results back.
  5. Pass Exa results to `gemini-3.1-pro-preview` using `zodToJsonSchema`. Validate schema drift via `.parse()`.
  6. Upon completion, write the heavy `{ idea, competitors, userId }` payload to `cloud_tasks_payloads` (Claim Check pattern).
  7. Dispatch background job: `enqueueTask("flywheel", "/api/internal/worker/flywheel-cache-jit", { payloadDocId })`.
  8. Stream the final structured data to the client and close the SSE connection.
- **Mounting:** Add `app.use("/api/niche", nicheRouter)` in `server.ts`.

## 3. Asynchronous JIT Caching & Collision Engine (Cloud Tasks Worker)

- **File:** `src/server/routes/workerRoutes.ts`
- **Change:** Add `workerRouter.post("/flywheel-cache-jit", ...)` to handle the background write. The worker must hold the HTTP request open until `batch.commit()` finishes to guarantee Cloud Run CPU allocation.
- **Collision Engine Logic:**
  - **Claim Check:** Retrieve the heavy payload from `cloud_tasks_payloads` using `payloadDocId`, then delete the payload document.
  - **Demand Heat Map (The User Idea):** Save the raw user query to a new `founder_demand_queries` collection (or append to competitors) so we don't lose the critical "User Idea <-> Competitor" bipartite graph.
  - **Domain Normalization:** Strip `www.`, cast to lowercase, and parse via `URL` to prevent Firestore `Invalid document reference` errors (which occur if IDs contain `/`).
  - **Atomic Updates:** Use `WriteBatch`. Update competitors with `demand_score: FieldValue.increment(1)`. Rely on Cloud Tasks exponential backoff to handle `DEADLINE_EXCEEDED` contention if a niche goes viral.

## 4. Frontend Data Moat & Telemetry (UI/UX)

- **Reverse Demo Hooks (`ZeroFrictionEntry.tsx`):**
  - Shift from multi-input forms to single-input (URL or simple Idea) to lower the barrier. Show initial market gravity/tarpit score immediately to prove value, then ask for Audience/Channel progressively using "Binary Triage" (e.g., presenting AI-generated guesses as chips the user includes/excludes).
- **Capture Tarpit Persistence & Pivots (`ZeroFrictionEntry.tsx`, `PivotSimulator.tsx`):**
  - Log when a user explicitly rejects an AI pivot to pursue a known tarpit. When accepting a pivot, write the accepted pivot to Firestore and a `pivot_decisions` analytics table.
- **The "Correction" Moat (`InsightEngineChat`, `TrustBuilderScreen`):**
  - Capture when users correct AI market assumptions (e.g., dismissing an insight with a specific reason, or manually upgrading a competitor's threat level). Introduce an LLM tool `save_negative_constraint` to explicitly capture founder corrections.
- **Interaction Validation Pipeline (`FounderWorkspace.tsx`):**
  - Replace static insight lists with a "Validation Pipeline" (drag-and-drop to move insights from "AI Guesses" to "My Strategy") or point-allocation UI (spending limited "Focus Points"). This explicit promotion cleanly separates "AI Hypothesized" from "Founder Verified."

## 5. Data Perimeter & Staging (Integrity)

- **Strict Validation:** Enforce strict Zod boundaries and DOMPurify on frontend inputs to prevent Prompt Injection, XSS, and memory exhaustion.
- **Semantic Gatekeeping:** Use a fast LLM pass (like `gemini-3.1-flash-lite-preview`) to execute an Intent Classification Check ("Is this a coherent product idea?") to reject garbage inputs before they reach the main flywheel.
- **Staging / Quarantine Architecture:** Write new vectors from the JIT hot path to a `tarpit_queries_staging` collection first. A background rollup worker will filter out statistical anomalies and scrub PII before promoting them to the active K-Means clustering dataset.

## 6. OpenSpec Conformance

- **Action Required on Execution:** Move this plan from `.cursor/plans/` into the official `openspec/plans/` directory to prevent split-brain state, and run the standard `npm run openspec propose` flow.

## 7. Error Handling and Resilience

- **Express 5.x Native Bubbling:** Remove unnecessary `try/catch` blocks; let async errors bubble naturally unless swallowing fire-and-forget telemetry.
- **Cloud Tasks Idempotency:** The worker ensures idempotent execution by verifying the Claim Check document still exists before processing.
