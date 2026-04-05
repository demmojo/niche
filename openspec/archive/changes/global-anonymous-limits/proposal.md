> **NOTICE:** This spec has been **superseded** by [plg-teaser-idea-validation].

# Proposal: Global Anonymous Limits and Token Truncation

## Why

While device fingerprinting prevents individual abuse (Denial of Wallet), a viral spike of legitimate anonymous traffic could still quickly exhaust the daily LLM budget. Additionally, feeding 15 full web pages from Exa search results into `gemini-3.1-pro-preview` for unauthenticated free users represents a massive input token drain. We need system-wide circuit breakers and aggressive context window management for the PLG teaser flow to ensure sustainable unit economics.

## What Changes

- **Global Circuit Breaker**: Add a global counter in Firestore (`system_limits/anonymous_daily_{YYYY-MM-DD}`) that tracks total anonymous teaser runs. If `count >= 30` for the current day, reject new requests with a `429 Too Many Requests` status.
- **Token Minimization (Local Truncation)**: Implement strict local text truncation for anonymous users. When fetching competitor contents via Exa, restrict the context window natively or locally to a strict maximum (e.g., 4000 characters) before passing it to the Gemini prompt.

## Capabilities

- `global-circuit-breaker`
- `token-minimization`
- `premium-teaser-fingerprinting`

## Impact

Ensures sustainable unit economics for the free PLG teaser flow, capping the maximum daily financial exposure from unauthenticated API calls while simultaneously dropping the per-call token consumption cost.
