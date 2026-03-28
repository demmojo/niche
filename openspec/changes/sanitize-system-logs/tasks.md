## 1. Sanitize System Logs UI and Data

- [ ] 1.1 In `src/App.tsx` (around the `System Logs` rendering block), conditionally render the `<details>` elements for `log.contextData` and `log.apiCallDetails` only if `isSuperadmin` is true.
- [ ] 1.2 In `src/App.tsx` and the Node/Express backend worker (e.g., `server.ts` or ingestion pipeline), update the log strings related to Apollo enrichment (e.g., `"Could not fetch Apollo data for " + domain + " (Status: " + apolloRes.status + "). Skipping enrichment."`) to generic terms like `"Could not fetch competitor data for " + domain + ". Skipping enrichment."`.
- [ ] 1.3 Update any other log strings that explicitly mention "Apollo" (e.g. "Successfully enriched " + domain + ".", "Network error enriching " + domain + ".") to ensure they don't contain vendor names.

## 2. Implement 1-Retry Mechanism

> **NOTE:** The `raw-data-library` feature moves ingestion to a Node/Express background worker. Therefore, this retry mechanism MUST be implemented in the backend worker routes, not just the frontend `fetch` calls.

- [ ] 2.1 Introduce a 1-retry `for` loop (or async helper) around the Apollo enrichment fetch block in the backend worker (e.g., `server.ts`). If the frontend still has direct API calls for fallback/legacy reasons, apply it there too.
- [ ] 2.2 Ensure the retry logic waits a short period (e.g., 1000ms + random jitter) before retrying the enrichment call upon a non-200 response or network error. If the second attempt fails, it should log the sanitized error message and continue.
- [ ] 2.3 Also apply the retry mechanism to the news fetching logic (e.g., `/api/apollo/news`) to prevent sporadic failures.
