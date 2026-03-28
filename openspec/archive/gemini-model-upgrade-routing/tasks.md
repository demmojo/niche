# Tasks

## Phase 1: Model Audit and Replacements

- [x] Remove all references to `gemini-3-flash-preview` and other legacy models across the codebase.
- [x] Add `gemini-3.1-flash-lite-preview`, `gemini-3.1-flash`, and `gemini-3.1-pro-preview` to the allowed models list.
- [x] Update mocked models in `src/__tests__/` to reflect the 3.1 model family.

## Phase 2: Capability-Driven Routing Implementation

- [x] Update `src/utils/aiClient.ts` to accept a `Capability` flag (`'reasoning' | 'chat' | 'extraction'`).
- [x] Define the fallback arrays for each tier based on the new `Capability` type.
- [x] Refactor `getSelectedModels()` to leverage the new 3.1 tiering.
- [x] Implement explicitly safe failover chains preserving capability floors.

## Phase 3: Resiliency and Performance Controls

- [x] Implement a concurrency limiter (e.g., `p-limit` set to 5-10) for extraction queues in `aiClient.ts`.
- [x] Refactor `withModelFallback` to handle 429 Rate Limits with exponential backoff and jitter prior to tier escalation.
- [x] Validate API payloads explicitly before sending requests to newer models to ensure security standards are preserved.

## Phase 4: Usage Tracking and Migration

- [x] Refactor `src/utils/usageTracker.ts` to parse exact token usage directly from the API response payload instead of using static estimates.
- [x] Update `trackRequest` to use an in-memory accumulator and debounce `localStorage` writes.
- [x] Implement the `localStorage` migration step in `src/components/Settings.tsx` to silently update legacy models to `gemini-3.1-flash`.
- [x] Ensure unit/integration tests (e.g., `Settings.test.tsx`, `aiClient.test.ts`) pass with the new specifications.
