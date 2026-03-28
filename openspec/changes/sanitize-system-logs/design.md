## Context

We rely on third-party APIs (such as Apollo.io) to enrich competitor profiles. Currently, the raw API responses, including vendor names and HTTP status codes, are displayed in the System Logs UI for all users. This creates a potential information disclosure risk, especially for competitors who might use our platform. Since users already have access to the raw data library for data transparency, they do not need to see the raw API requests or responses in the logs.

## Goals / Non-Goals

**Goals:**

- Hide raw JSON context data and response details from non-superadmins.
- Ensure log details use generic terms (e.g., "competitor data" instead of "Apollo data").
- Remove HTTP status codes from the UI logs (e.g., "(Status: 422)").
- Implement a 1-retry mechanism with exponential backoff for Apollo API calls before logging a failure.

**Non-Goals:**

- We are not changing the data actually fetched or stored in the Raw Data Library.
- We are not obfuscating errors in backend console logs or internal monitoring systems.

## Decisions

**1. Hiding JSON Details from Non-Superadmins**

- **Decision**: Wrap the rendering of `<details>` blocks for `contextData` and `apiCallDetails` in `src/App.tsx` with a check against the `isSuperadmin` boolean prop already available in the `ActiveApp` component.
- **Rationale**: The simplest way to restrict access to superadmins without altering the underlying data structure or the `updateLog` function signature.

**2. Sanitizing Log Messages**

- **Decision**: Replace hardcoded vendor names (e.g., "Apollo") in the `updateLog` details with generic terms like "competitor data". Remove the `apolloRes.status` string concatenation from the details message.
- **Rationale**: Prevents users (and competitors) from reverse-engineering the services we use, while still providing clear failure messages.

**3. Implementing 1-Retry Mechanism**

- **Decision**: Introduce a `for` loop (or recursive helper) around the Apollo enrichment `fetch` calls. It will attempt the request up to 2 times (initial + 1 retry) with a short exponential backoff delay before throwing an error.
- **Rationale**: Improves resilience against transient network errors or rate limits, without adding massive complexity or external libraries.

## Risks / Trade-offs

- **Risk: Increased API Latency** -> Adding a retry means the user might wait slightly longer if the API is genuinely down.
- **Mitigation**: Limit the retries to 1, and only add a small backoff delay (e.g., 1000ms).
