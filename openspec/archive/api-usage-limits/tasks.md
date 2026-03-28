## 1. Implement API Key Management (BYOK)

- [x] 1.1 Update `Settings.tsx` to include input fields for Gemini, Apollo, and Exa API keys.
- [x] 1.2 Implement secure local storage of these keys using `src/utils/apiKeys.ts`.
- [x] 1.3 Update `src/utils/geminiClient.ts` to prioritize custom keys over environment variables.
- [x] 1.4 Update API fetch calls for Exa and Apollo in `src/App.tsx` (and `server.ts` if applicable) to prioritize custom keys.

## 2. Implement Real-Time Quota Tracking

- [x] 2.1 Refactor `src/utils/usageTracker.ts` to log both success and error counts per API key per day.
- [x] 2.2 Add an "API Usage Dashboard" to `Settings.tsx` to display visual progress bars for each service's real quotas.
- [x] 2.3 Clearly label the dashboard usage metrics as "Estimated Local Usage".

## 3. Clear Limit Communication and Support Integration

- [x] 3.1 Intercept 429 Too Many Requests errors in `src/utils/geminiClient.ts` and API fetch calls.
- [x] 3.2 Implement a specific, actionable toast or modal when a 429 error occurs, clearly explaining *why* the limit was hit.
- [x] 3.3 Add a "Request Higher Limits" button to the 429 error message that directs the user to the `SupportHelpPage` with the "Limit Increase Request" pre-selected.
- [x] 3.4 Differentiate between a global `.env` key failure and a custom key failure in the error messaging.
