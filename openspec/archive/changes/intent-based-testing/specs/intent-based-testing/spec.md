# Specification

## 1. Firebase Race Conditions

- **Scenario**: The 'Snapshot Beats the Fetch' anomaly.
  - **WHEN** a user initiates a mutation and MSW delays the HTTP response via `delay()`.
  - **AND** the Firebase emulator writes and broadcasts an `onSnapshot` update immediately.
  - **THEN** the UI consumes the real-time update and does not get overwritten by stale closures when the delayed fetch resolves.

## 2. LLM Stream Property-Based Parsing

- **Scenario**: Unpredictable SSE chunks from `gemini-3.1-pro`.
  - **WHEN** LLM event payloads are sliced at unpredictable random index boundaries via `fast-check`.
  - **THEN** the stream ingestion parser never throws a `SyntaxError`.
  - **AND** the finalized assembled object cleanly passes Zod schema validation.

## 3. UX Intent & Explainable States

- **Scenario**: Sequential loading awareness for Screen Readers.
  - **WHEN** a slow ML task runs and time is advanced via `vi.useFakeTimers()`.
  - **THEN** sequential loading messages correctly render inside an `aria-live="polite"` DOM element.
  - **AND** the parent container toggles `aria-busy="true"`.
  - **AND** no generic `<Spinner />` implementations fallback incorrectly.
- **Scenario**: Reverse Demo Hook Navigation.
  - **WHEN** the user interacts to request a deep report.
  - **THEN** the correct PQL `<dialog>` opens seamlessly after the risk score evaluation resolves.

## 4. Stochastic CI Evaluation

- **Scenario**: LLM-as-Judge Non-Regression.
  - **WHEN** a PR triggers a `*.eval.test.ts` pipeline.
  - **THEN** outputs are generated N times to build a 95% Confidence Interval baseline.
  - **AND** `gemini-3.1-pro` at temperature 0.1 evaluates the candidate vs baseline.
  - **THEN** the candidate must achieve `CANDIDATE_WINS` or `TIE` at a >= 90% rate to pass the CI gate.
