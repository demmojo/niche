# API Usage Tracking and Limit Communication

This specification details the Bring Your Own Key (BYOK) system, the real-time API Usage Dashboard, and transparent error handling when API limits are reached.

## Features

### 1. API Key Management (BYOK)

- **Input UI:** A new section in `src/components/Settings.tsx` to input custom API keys for Gemini, Apollo.io, and Exa.ai.
- **Storage:** Securely store entered keys in `localStorage` using existing or new `src/utils/apiKeys.ts` methods.
- **Priority:** All API request mechanisms (`fetch`, `GoogleGenAI`) must attempt to use the custom key first, and only fall back to the `.env` provided key if a custom one is absent.

### 2. API Usage Dashboard

- **Location:** Added to the "Settings" tab.
- **Metrics Displayed:** Show a daily request count for:
  - Gemini API (estimated token input/output)
  - Apollo.io API (search/enrich requests)
  - Exa.ai API (news/company searches)
- **Visual Indicators:** Use progress bars representing local usage against expected daily limits (e.g., Gemini Flash: 15/50 per day).

### 3. Rate Limit Communication

- **Error Interception:** When an API request fails with a 429 status code or a quota-exceeded error, the client must catch the error.
- **Limit Messaging:** The user must be shown a clear message explaining that the API rate limit has been reached, *why* it happens (high volume or free-tier constraints), and what they can do next.
- **Call to Action (Support):** Offer a direct link or button labeled "Request Higher Limits" that opens the `SupportHelpPage` with the "Limit Increase Request" pre-selected.

## State Management

- Use `src/utils/usageTracker.ts` to log every API call made locally to `localStorage` (`api_usage_stats`).
- Maintain an `isRateLimited` boolean flag per service to lock out subsequent requests until the reset period (midnight Pacific Time) or a new key is provided.

## Error Handling

- Specific catch blocks for `GoogleGenAI` and `fetch` calls to detect 429s.
- Differentiate between a global `.env` key failure (prompting the user to add a custom key) and a custom key failure (prompting the user to check their provider dashboard or contact NicheAI support for an increase).
