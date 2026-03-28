## 1. UI Updates
- [x] 1.1 In `src/App.tsx`, rename the "Validate Data" button to "Check System".
- [x] 1.2 Update the tooltip for the button to "Check data integrity and validate external systems".

## 2. Function Refactoring
- [x] 2.1 Rename the `runDataValidation` function to `runSystemCheck` in `src/App.tsx`.
- [x] 2.2 Update all references to the function within `src/App.tsx`.
- [x] 2.3 Ensure local state validation logic remains intact and logs correctly.

## 3. External API Validation
- [x] 3.1 Append an external API validation block at the end of `runSystemCheck`.
- [x] 3.2 Implement a `fetch` request to `https://api.exa.ai/search` using available Exa API keys.
- [x] 3.3 Log a success message if the Exa API responds correctly.
- [x] 3.4 Log an error message with the failure reason if the Exa API check fails.
