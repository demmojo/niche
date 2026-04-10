# Tasks: Superadmin Pipeline

## Phase 0: TDD & Coverage Configuration

- [x] Configure `vitest.config.ts` to mathematically enforce `95%` global coverage thresholds (statements, branches, functions, lines).
- [x] Configure CI/CD `npm run test:coverage` pipeline to block merges if global coverage drops below `95%`.

## Phase 1: Database & Foundation

- [x] **TEST:** Write intent-based Firebase Emulator tests for `leads` and `pending_reports` schemas and security rules.
- [x] Create `leads` Firestore collection schema.
- [x] Create `pending_reports` Firestore collection schema (fields: draft_markdown, lineage_data, status).

## Phase 2: Frontend - Two-Phase Fetch

- [x] **TEST:** Write RTL+MSW intent-based tests for `/roast-my-niche` UI (synchronous Gemini 3.1-flash surface roast, and >50 queue throttling).
- [x] Build `/roast-my-niche` input UI.
- [x] Integrate `gemini-3.1-flash` for synchronous 3-bullet "Surface Roast".
- [x] Build email capture form for Phase 2 handoff.
- [x] Implement frontend logic to disable submissions if pending reports > 50.

## Phase 3: Backend - 2-Agent Pipeline

- [x] **TEST:** Write intent-based Vitest tests mocking Exa/Apollo and `gemini-3.1-pro` for DataGatherer and ReportSynthesizer.
- [x] Implement DataGatherer Agent (intent extraction + Exa/Apollo API hooks).
- [x] Implement ReportSynthesizer Agent (`gemini-3.1-pro` + Tarpit/Moat prompt logic).
- [x] Connect pipeline to write drafts into `pending_reports` collection.

## Phase 4: Superadmin Dashboard

- [x] **TEST:** Write RTL+MSW intent-based tests for Superadmin `{ isSuperadmin: true }` gated route, editable `<textarea>`, and Approve/Reject mutations.
- [x] Build `/admin/pending-roasts` route protected by `{ isSuperadmin: true }` JWT claim.
- [x] Create UI to list `pending` reports.
- [x] Build the review view: display raw input, lineage data, and editable `<textarea>`.
- [x] Implement "Approve" and "Reject" database mutation actions.

## Phase 5: PQL Delivery & Auth Gate

- [x] **TEST:** Write Playwright E2E intent-based tests covering report approval, transactional email dispatch, and Firebase Auth gate.
- [x] Set up transactional email dispatch on report approval (no direct links).
- [x] Build user dashboard view for approved reports.
- [x] Implement Firebase Auth gate protecting the report view.

## Phase 6: Global Coverage Validation

- [x] Run global `npm run test:coverage` (`vitest run --coverage`) to mathematically verify >95% coverage across all thresholds before marking spec as complete.

## Phase 7: Advanced Testing & CI/CD

- [ ] Implement mathematical/property-based testing for JSON stream parsers via `fast-check` to prove stream handling under fuzzing.
- [ ] Update CI/CD workflow (`stochastic-eval.yml`) to include automated Pairwise Judge evaluation (`gemini-3.1-pro`) for non-deterministic iterations.
- [ ] Implement mid-stream `AbortController` cancellation tests for LLM pipelines to ensure graceful degradation.
