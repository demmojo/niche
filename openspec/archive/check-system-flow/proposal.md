## Why

As NicheAI relies heavily on external data APIs to construct market intelligence and context, it's critical to ensure our system remains stable and API integrations are operational. Currently, the "Validate Data" action only verifies the integrity of local client-side state (competitors, raw data, insights) but completely ignores the health of external dependencies like search APIs. By introducing a comprehensive "Check System" flow and renaming the old "Validate Data", we can surface both local data inconsistencies and external integration failures (such as the newly integrated Exa API) through a unified interface.

## What Changes

Transform the existing "Validate Data" flow into a comprehensive "Check System" validation sequence.

- **Rename "Validate Data" to "Check System"**: Update the UI label and underlying function names (`runDataValidation` -> `runSystemCheck`) to reflect the broader scope of this system task.
- **External API Validation (Exa API)**: Incorporate a live connectivity test for the Exa Search API as part of the system check. This will use the configured `EXA_API_KEY` to execute a lightweight `type: "fast"` search query.
- **Unified Log Reporting**: The system log will continue to report local data issues, but will now additionally append successful connections or failures to external services, providing clear visibility into why data orchestration flows might be failing.

## Capabilities

### Modified Capabilities
- `system-check-flow` (formerly `validate-data`): A client-side flow triggered from the Background Tasks & Sync page. It maps and checks internal data structures (competitors, raw data sources, and derived insights) and subsequently pings external search APIs (Exa) to ensure they are available and responding correctly.

## Impact

- **`src/App.tsx`**: 
  - Renamed the button on the Background Tasks & Sync page from "Validate Data" to "Check System".
  - Renamed `runDataValidation` to an asynchronous `runSystemCheck`.
  - Added an external `fetch` request to `api.exa.ai/search` at the end of the `runSystemCheck` pipeline to validate search endpoints.
- **`vite.config.ts`**:
  - Injected `process.env.EXA_API_KEY` into the frontend context to allow the system check to perform external requests.
- **Environment**: 
  - The check gracefully falls back or tests against the configured `EXA_API_KEY` in `.env`.
