# Tasks

## Phase 1: Zero Data Retention (ZDR) & Ephemerality Receipts

- [x] Update `llmRoutes.ts` to strictly enforce ZDR flags/headers for Gemini, Anthropic, and OpenAI.
- [x] Implement `403 Forbidden` fallback if a provider tier rejects ZDR for `sensitive=true`.
- [x] Implement server-side generation of the SHA-256 "Ephemerality Receipt" (prompt + timestamp + specific LLM transaction ID/headers).
- [x] Return the Ephemerality Receipt alongside the LLM response payload to prove provider attestation.
- [x] Build the "ZDR Lock" UI indicator and Receipt Viewer component in frontend ideation views.

## Phase 2: Granular RAG Provenance & Source Anchoring

- [x] Update RAG prompt templates to strictly require inline `<cite>` tags tied to injected metadata IDs.
- [x] Implement a fast context-window token estimator (4 chars/token heuristic) with a 100-token safety margin.
- [x] Implement a "Middle-Truncation" strategy for overflowing RAG docs to preserve document metadata at the start and conclusions at the end.
- [x] Store provenance metadata as lightweight ID pointers to prevent inline text bloat.
- [x] Create `CitationMap` in a new Zustand store to manage active session sources.
- [x] Develop custom React markdown plugin to parse `<cite>` tags into interactive hover tooltips (raw text + timestamp).

## Phase 3: Action Audit Log & Autonomy Dial

- [x] Update `useActionAuditStore` to act as a projection of a live Firestore query (`limit(50)`) instead of a local circular buffer.
- [x] Update background task logic to write `PENDING_CONSENT` tasks to Firestore and exit, rather than pausing in-memory queues in `queues.ts`.
- [x] Build the "Autonomy Dial" UI component (toggle Co-Pilot vs. Auto-Pilot).
- [x] Build the interactive Audit Log UI for reviewing, batching, and approving queued LLM actions via Firestore state updates (`PENDING_CONSENT` -> `QUEUED`).

## Phase 4: Explainable Rationale & Counterfactuals

- [x] Implement an additive feature contribution model (e.g., intercept + top-5 drivers) for the heuristic score breakdown in the backend.
- [x] Update the backend to return a base payload of additive heuristic weights (`{ base_score: 85, drivers: [{ name: "Market Size", weight: 0.4, current_val: 10 }] }`).
- [x] Design and implement the "Score Breakdown Drawer" UI to visualize top-driver attribution metrics.
- [x] Build "Counterfactual Sliders" in the ideation phase to allow dynamic input testing.
- [x] Implement pure frontend React math to recalculate the score synchronously when the slider moves (`new_score = base_score + (delta * weight)`), eliminating backend batching and caching.
