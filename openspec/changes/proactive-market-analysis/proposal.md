## Why

Users currently lack visibility into the background sync process when interacting with the Market Analysis chat. There is no clear indication of data freshness, and deep analysis results aren't surfaced proactively in a non-disruptive way. The chat UX needs to be modernized to provide higher time-to-value through inline actions and better sync state awareness.

## What Changes

- Introduce a progressive sync banner that displays real-time background task progress without blocking the chat.
- Add data freshness indicators (stale vs. fresh) directly in the Market Analysis view.
- Implement a proactive insight generator popup that triggers when a deep analysis completes.
- Enhance the chat UX with inline buttons to generate features and insights instantly.
- Default to "Pro" models for market data analysis unless otherwise specified.
- Prompt the user to sync if no prior sync has been performed before starting analysis.

## Capabilities

### New Capabilities

- `sync-progress-banner`: A non-blocking banner showing current sync stages (Grounding, AI analysis, etc.).
- `proactive-insight-popup`: A mixed-initiative popup that surfaces new deep analysis results and asks if the user wants to explore them.
- `data-freshness-indicator`: Visual representation of how recent the market data is.

### Modified Capabilities

- `market-analysis-chat`: Upgraded UX with inline feature/insight generation buttons and smart default to Pro models.

## Impact

Affects the `MarketAnalysis` component, global `SyncQueue` state, and the AI client wrapper for model selection.
