# Proposal: Global Pro Quota and Token Optimization for Anonymous Users

## Why

We upgraded the anonymous PLG teaser flow to use `gemini-3.1-pro-preview` and `exa.searchAndContents` to maximize the "endowment" effect and drive conversions. However, even with IP/device fingerprinting limiting users to 3 runs, viral spikes could still drain the LLM wallet significantly.

To achieve business sustainability while preserving the "Reverse Demo Hook", we must enforce a global daily limit of 30 anonymous Pro runs. Once this quota is exhausted, the system should gracefully downgrade unauthenticated users to the cheaper `gemini-3.1-flash` model. Additionally, we must aggressively optimize token usage for anonymous users by truncating the bulky Exa page contents before they are passed into the LLM context.

## What Changes

1. **Global Pro Quota Tracking:** Update `src/server/scoringRoutes.ts` to call `checkAndIncrementGlobalAnonymousLimit` (with a limit of 30) for anonymous requests. If the global quota is reached, dynamically switch the LLM model for the session to `gemini-3.1-flash` instead of `gemini-3.1-pro-preview`.
2. **Token Optimization:** For anonymous users, strictly truncate the `exa.searchAndContents` `text` payload (e.g., maximum 500 characters per result instead of 1000) before concatenating it into the `competitorContext` string.
3. **Database Rules:** Ensure the `system_limits` collection in Firestore properly tracks the `anonymous_daily_${date}` document using transactions.

## Capabilities

- `global-quota-fallback`
- `token-truncation`

## Impact

Massive reduction in potential worst-case API costs during a viral event, ensuring the business model remains sustainable without abruptly breaking the PLG flow for users.

# Design

## Context

Denial of Wallet (DoW) protection requires defense-in-depth. User-level fingerprinting stops individual abuse, but global quotas stop macro-level cost explosions.

## Goals & Non-Goals

- **Goals:** Cap global anonymous Pro usage to 30/day. Gracefully fallback to Flash. Reduce Exa context token bloat for anonymous users.
- **Non-Goals:** Complex local LLM summarization. Simple string truncation (`substring`) achieves the required token limits with zero latency and zero cost.

## Decisions

- **Model Downgrade:** `gemini-3.1-flash` is chosen as the fallback because it provides near-Pro latency and structured JSON capabilities at a fraction of the cost.
- **Strict Truncation:** We will slice `r.text.substring(0, 500)` for anonymous users, ensuring the total prompt stays extremely lightweight.

## Risks & Trade-offs

- **Quality Drop:** After 30 users, the 31st user gets slightly less accurate insights (Flash vs Pro). This is an acceptable business trade-off to cap costs.

# Spec

## Detailed Features

1. **Model Fallback Logic:**
   - `let selectedModel = "gemini-3.1-pro-preview";`
   - If anonymous, `const hasGlobalQuota = await checkAndIncrementGlobalAnonymousLimit(30);`
   - `if (!hasGlobalQuota) { selectedModel = "gemini-3.1-flash"; }`
2. **Context Truncation:**
   - When building `competitorContext`, if `isAnonymous`, slice `r.text` to 500 characters max per result.

# Tasks

## Phase 1: Integration

- [ ] Implement global quota check in `/api/scoring/stream` logic.
- [ ] Conditionally route `gemini-3.1-pro-preview` to `gemini-3.1-flash` if the global quota is exhausted.
- [ ] Implement string truncation (max 500 chars per Exa result) for anonymous users.

## Phase 2: Testing

- [ ] Mock the global limit transaction in `src/__tests__/server/scoringRoutes.test.ts` to verify the fallback triggers correctly without throwing an HTTP error.
- [ ] Verify that the Exa context string size is properly truncated for anonymous users in the tests.
