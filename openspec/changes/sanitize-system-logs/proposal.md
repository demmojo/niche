## Why

Currently, the System Logs expose third-party vendor names (like Apollo.io) and HTTP status codes (e.g., 422) to all users. Additionally, the raw JSON blocks for "View Context Data" and "View Response Details" are visible to everyone. This exposes our internal tooling and architecture to competitors and creates a suboptimal user experience. Furthermore, some API calls (like Apollo enrichment) fail without any retry attempt, leading to missing data.

## What Changes

1. Hide the "View Context Data" and "View Response Details" sections in the System Logs UI for non-superadmin users.
2. Sanitize log messages to replace specific vendor names (e.g., "Apollo") with generic terms (e.g., "competitor data provider" or "competitor data") and remove HTTP status codes from the UI logs.
3. Implement a 1-retry mechanism for third-party API calls (like Apollo enrichment) before logging a failure and skipping.

## Capabilities

### Modified Capabilities

- `system-logs-ui`: The System Logs UI will conditionally hide technical JSON details from non-superadmin users. Log messages will be generic and not expose vendor tools or HTTP status codes.
- `data-enrichment`: Apollo API calls will now automatically retry once upon failure before giving up.

## Impact

This impacts the frontend logging UI (`src/App.tsx`), the global data enrichment flow, and how errors are surfaced to the user.
