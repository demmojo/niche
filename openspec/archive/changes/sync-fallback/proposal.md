# Proposal: Synchronous Fallback

## Why

The Batch API latency (24+ hr) breaks immediate Time-to-Value (TTV) for newly discovered hyper-niches. For unseeded searches, we need to route through a synchronous fallback (Exa -> Gemini Flash) to preserve the immediate "wow" moment for the user.

## What Changes

1. **Real-time Fallback Path**: Implement a synchronous fallback (Exa -> Gemini Flash) for unseeded hyper-niches.
2. **Circuit Breaker**: Add a Circuit Breaker (`src/utils/circuitBreaker.ts`) to handle external API failures. If Exa fails 3 consecutive times in a 5-minute window, sync extraction is disabled, falling back to a graceful degraded UI state. Resets after 5 minutes.
3. **Timeouts**: Enforce strict 10-second timeouts on external API calls (Exa & Gemini Flash) to protect system stability.
4. **Verification**: Review and integrate with existing logic in `src/server/scoringRoutes.ts`.

## Capabilities

- `real-time-sync-fallback`: Executes immediate (Exa -> Gemini Flash) extraction for unseeded hyper-niches with strict 10s timeouts.
- `exa-circuit-breaker`: Disables Exa synchronous fallback on 3 consecutive failures to prevent cascading latency, resetting after 5 minutes.

## Impact

Drastically improves TTV for unseeded niches, providing instant value to users. Protects system stability through robust circuit breaking and timeout patterns.
