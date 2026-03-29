## 1. Backend Core & Routes

- [x] 1.1 **Test:** Write failing MSW/Firebase Emulator intent-based tests for `LLMPenaltyBox.ts`, `llmRoutes.ts`, and `scoringRoutes.ts`.
- [x] 1.2 **Implement:** Refactor any uncovered logic needed to make tests pass or mock reliably.
- [x] 1.3 **Test:** Write failing MSW/Firebase Emulator intent-based tests for `rateLimit.ts` and `queues.ts`.
- [x] 1.4 **Implement:** Implement rateLimit and queues tests to pass.
- [x] 1.5 **Test:** Write failing MSW tests for `sse.ts`, `telemetryRoutes.ts`, and `routes/telemetryRoutes.ts`.
- [x] 1.6 **Implement:** Fix any async logic for SSE tests to pass.

## 2. Services & Utilities

- [x] 2.1 **Test:** Write failing unit tests for `services/tarpitFlywheel.ts`.
- [x] 2.2 **Implement:** Isolate dependencies for `tarpitFlywheel.ts` to test internal branching successfully.
- [x] 2.3 **Test:** Write failing unit tests for `utils/mathUtils.ts`, `utils/telemetry.ts`, and `utils/imageUtils.ts`.
- [x] 2.4 **Implement:** Correct logic for coverage gaps to pass cleanly.

## 3. Final Testing & Validation

- [x] 3.1 Verify targeted local coverage (`npm run test -- <changed-files> --coverage`) and global coverage (`npm run test --coverage`) meets the >80% threshold, reaching near 100%.
