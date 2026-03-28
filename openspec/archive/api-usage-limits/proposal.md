## Why

Currently, NicheAI relies on built-in environment variables for external API services (Gemini, Apollo, Exa). This creates an opaque quota system where users might unexpectedly hit rate limits, and power users cannot bypass these limits by providing their own API keys. Furthermore, any current usage tracking is local and estimated, which drifts from actual platform quotas. This makes it hard for users to trust the usage limits displayed, preventing them from optimally utilizing NicheAI's capabilities without fear of hitting a wall.

## What Changes

Introduce a unified system for tracking real-time usage statistics and limits across external APIs, allowing users to configure custom API keys.

- **API Key Management**: Introduce a secure UI section in `src/components/Settings.tsx` where users can add, validate, and store custom API keys for Gemini, Apollo, and Exa.
- **Real-time Quota Fetching & Tracking**: Expand `src/utils/usageTracker.ts` into a universal `ApiUsageManager`. It will track local requests and periodically poll respective APIs for real usage and limit data (e.g., via dedicated quota endpoints or by inspecting rate-limit HTTP headers from regular responses).
- **Real-time Quota Dashboard**: Add an "API & Limits" dashboard to the Settings panel showing visual progress bars for each service's real quotas (e.g., Apollo Enrichment: 50/100 per day, Gemini Pro: 30/50 per day), updated periodically from the source.
- **Backend/Client Key Overrides**: Update the Express backend `server.ts` Apollo endpoints (`/api/apollo/*`) to accept an `x-api-key` header from the client, falling back to the `.env` value. Also ensure rate-limit headers are forwarded back to the client. Update `src/App.tsx` and `src/utils/geminiClient.ts` to retrieve user-configured keys from storage and use them in their respective API requests.
- **Comprehensive Testing**: Implement unit tests for key management and rate limit tracking, integration tests for header forwarding on the Express backend, system tests for the `Settings.tsx` UI, and end-to-end testing with Playwright to verify the complete Bring Your Own Key (BYOK) and rate limit flows.

## Capabilities

### New Capabilities
- `api-key-management`: UI and storage mechanism for users to supply their own API keys for Gemini, Apollo, and Exa.
- `real-time-quota-tracking`: Backend and frontend systems to poll, track, and display actual API usage and remaining limits directly from the service providers.

### Modified Capabilities
- `system-settings`: Expanded to include the real-time API usage dashboard and key management controls.

## Impact

This will require refactoring API clients (`src/utils/geminiClient.ts`, `src/App.tsx`) and the usage tracker (`src/utils/usageTracker.ts`). The Express backend (`server.ts`) must be updated to handle custom headers. The `Settings.tsx` component will be heavily modified to support the new features.
