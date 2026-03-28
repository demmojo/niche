## Context

NicheAI currently relies on a single set of environment variables (`GEMINI_API_KEY`, `EXA_API_KEY`, `APOLLO_API_KEY`) to serve all users. As usage grows, users risk hitting global rate limits. To solve this, we want to allow users to provide their own API keys (BYOK - Bring Your Own Key). We also need a transparent way to display API usage and limits to the user so they understand why a request might fail, and how to increase limits by contacting support.

## Goals / Non-Goals

**Goals:**
- Provide a secure UI in Settings for users to input their own API keys for Gemini, Apollo, and Exa.
- Store these custom keys locally and securely (e.g., `localStorage`).
- Refactor API client wrappers to prioritize custom keys over environment variables.
- Display a clear API Usage dashboard showing the number of requests made today vs. the expected quota limit for each service.
- Communicate clearly when a custom key is invalid or a rate limit is hit, and provide a clear path to contact support to request higher limits.

**Non-Goals:**
- We are *not* building a central key management service (KMS). Keys will remain in local browser storage.
- We are *not* automatically purchasing or provisioning API keys for users.

## Decisions

1. **Storage of Custom API Keys:**
   - Keys will be stored unencrypted in the browser's `localStorage` via the `src/utils/apiKeys.ts` utility.
   - *Rationale:* Since this is a client-side heavy application, the keys must be available immediately to the JS context. Security relies on the user's physical device security.

2. **API Usage Dashboard:**
   - We will expand `src/utils/usageTracker.ts` to log both success and error counts per API key per day.
   - We will render visual progress bars in `Settings.tsx` to display estimated token usage (Gemini) and request counts (Exa, Apollo).

3. **Limit Communication:**
   - When an API responds with a 429 Too Many Requests, we will intercept this error and surface a specific, actionable toast or modal to the user.
   - We will include messaging explaining *why* the limit was hit and how to contact the support team or upgrade their own API tier.

## Risks / Trade-offs

- **Risk:** Storing API keys in `localStorage` exposes them to XSS attacks.
  - **Mitigation:** Ensure strict Content Security Policy (CSP) and carefully audit dependencies. Warn users that keys are stored locally.
- **Risk:** Discrepancy between local request tracking and true API provider quotas.
  - **Mitigation:** We will clearly label the dashboard usage metrics as "Estimated Local Usage".
