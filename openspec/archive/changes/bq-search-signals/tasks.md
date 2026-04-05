# Tasks

- [ ] Phase 1: BigQuery Service Implementation
  - [ ] Create `src/server/services/bigQuerySignals.ts`.
  - [ ] Implement partitioned query logic for GitHub Archive.
  - [ ] Implement partitioned query logic for Hacker News.
  - [ ] Implement partitioned query logic for Chrome UX Report.
  - [ ] Add cost-control guardrails (max bytes billed).
- [ ] Phase 2: Custom Search API Integration
  - [ ] Create `src/server/services/customSearchProxy.ts`.
  - [ ] Implement Google Programmable Search Engine adapter.
  - [ ] Add parsing for `totalResults` and sponsored ads indicators.
- [ ] Phase 3: Worker Integration
  - [ ] Update `src/server/workers/normalizationAdapterJob.ts` to invoke `bigQuerySignals`.
  - [ ] Update worker to invoke `customSearchProxy`.
  - [ ] Map extracted signals to the Execution Velocity Score schema.
- [ ] Phase 4: Testing & Validation
  - [ ] Write unit tests for BQ partition enforcement.
  - [ ] Write mock tests for Custom Search API responses.
