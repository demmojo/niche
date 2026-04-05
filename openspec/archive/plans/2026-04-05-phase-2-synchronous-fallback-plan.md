# Phase 2: Synchronous Fallback

## Why

The Batch API latency (24+ hr) breaks immediate Time-to-Value (TTV) for newly discovered hyper-niches. For unseeded searches, we need to route through a synchronous fallback (Exa -> Gemini Flash) to preserve the immediate "wow" moment.

## What Changes

Implement a real-time synchronous fallback path for unseeded hyper-niches.
Add a Circuit Breaker (`src/utils/circuitBreaker.ts`): if Exa fails 3 consecutive times in a 5-minute window, the synchronous extraction is disabled, falling back to a graceful degraded UI state. The circuit breaker resets automatically after the 5-minute window expires. Distributed state is handled implicitly or via Redis in the future; for now, in-memory is acceptable per node instance. Strict 10-second timeouts must be enforced on external API calls (Exa & Gemini Flash) to protect system stability.

_Note: Parts of this feature appear to already be present in `src/server/scoringRoutes.ts`. This plan will verify the implementation and complete any missing integrations (e.g. hooking it into the exact unseeded niche logic)._

## Capabilities

### New Capabilities

- `real-time-sync-fallback`: Executes immediate (Exa -> Gemini Flash) extraction for unseeded hyper-niches with strict 10s timeouts.
- `exa-circuit-breaker`: Disables Exa synchronous fallback on 3 consecutive failures to prevent cascading latency, resetting after 5 minutes.

## Relationships

- extends: []
