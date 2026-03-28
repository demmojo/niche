# Design: Intent-Based Testing Initiative

## Context

The system tests an optimistic data flow: React 19 UI -> MSW Network Boundary -> Express APIs -> Background Workers -> Firebase Emulator / LLM Mocks -> Real-time UI Sync. Intervening with testing requires handling concurrent data resolutions and React 19 `useTransition` interruptions.

## Goals

- Eliminate test hangs by standardizing Firebase and IndexedDB teardowns.
- Mathematically guarantee Zod schemas can gracefully reject or ingest partial JSON chunks from SSE LLM endpoints.
- Catch race conditions when real-time snapshot events precede HTTP mutation responses.
- Measure LLM variance and enforce non-regression in CI.

## Non-Goals

- Replacing full end-to-end tests (like Cypress/Playwright) covering live external networks; this targets local/MSW simulated environments.
- Manual implementation details assertion (e.g., asserting `useState` values).

## Decisions

- **PBT over Manual Fuzzing**: Use `zod-fast-check` to generate arbitraries for stream parsing tests.
- **MSW + Local Emulation**: Combine `msw` `delay()` with immediate Firebase writes to test UI stale closures.
- **Stochastic Separation**: Separate deterministic `*.test.ts` from non-deterministic `*.eval.test.ts`.

## Risks & Trade-offs

- CI running N-times LLM prompt evaluations increases execution time and API costs. We mitigate this by making it a separate GitHub Actions workflow that runs as a secondary gate.

## Future Potential

Once stabilized for P0 features, this stochastic eval and PBT stream framework can be abstracted into a standalone internal testing package for all NicheAI ML microservices.
