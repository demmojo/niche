---
status: superseded
superseded_by: plg-teaser-idea-validation
---

> **NOTICE:** This plan has been **superseded** by plg-teaser-idea-validation.

# OpenSpec Plan: Global Anonymous Limits and Token Truncation

## 1. Why

While device fingerprinting prevents individual abuse (Denial of Wallet), a viral spike of legitimate anonymous traffic could still quickly exhaust the daily LLM budget. Additionally, feeding 15 full web pages from Exa search results into `gemini-3.1-pro-preview` for unauthenticated free users represents a massive input token drain. We need system-wide circuit breakers and aggressive context window management for the PLG teaser flow to ensure sustainable unit economics.

## 2. What Changes

- **Global Circuit Breaker**: Add a global counter in Firestore (e.g., `system_limits/anonymous_daily_{YYYY-MM-DD}`) that tracks the total number of anonymous teaser runs across the entire platform. If `count >= 30` for the current day, the system will reject new anonymous requests with a `429 Too Many Requests` status.
- **Token Minimization (Local Truncation)**: Implement strict local text truncation for anonymous users. When fetching competitor contents via Exa, we will restrict the context window by either leveraging Exa's native `maxCharacters` limit per result or locally slicing the concatenated competitor text to a strict maximum length (e.g., 4000 characters) _before_ sending it to the Gemini Pro prompt.

## 3. Capabilities

- `global-circuit-breaker`
- `token-minimization`

## 4. Design/Architecture

- **Atomic Operations**: The global limit must be checked and incremented using Firestore atomic operations (e.g., `FieldValue.increment(1)`) or transactions to prevent race conditions during traffic spikes.
- **Zero-Latency Truncation**: Local string truncation (or relying on the Exa API's built-in character limits) is strongly preferred over using a smaller/cheaper LLM to summarize the content first. Local truncation introduces zero additional latency, zero potential for hallucination during summarization, and zero additional cost, aligning perfectly with the goal of protecting margins on the free tier.
- **Graceful Degradation**: When the global circuit breaker trips, the UI should gracefully explain that daily platform limits have been reached and encourage the user to create an account or try again tomorrow.
