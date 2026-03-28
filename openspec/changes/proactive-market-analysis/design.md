## Context

The Market Analysis page currently functions as a standard chat interface. To make it a true "research partner," it needs to be aware of asynchronous global syncs and proactively surface insights without disrupting the user's flow. We also need to ensure users are aware of data staleness to prevent hallucinated or outdated analysis.

## Goals / Non-Goals

**Goals:**

- Keep the user informed of sync progress without blocking the UI.
- Proactively offer new insights when background analysis completes.
- Make it 1-click easy to turn chat responses into saved features or insights.
- Ensure users know exactly how fresh their data is.

**Non-Goals:**

- Completely rewriting the chat engine.
- Blocking the user from chatting while a sync is in progress.

## Decisions

**1. Non-Blocking Sync Progress Banner**

- **Decision**: Implement a persistent, dismissible banner or "mixed-initiative" chip in the chat UI that tracks sync stages (Queued -> Grounding -> Synthesizing).
- **Rationale**: Based on UX best practices, blocking loaders cause anxiety. A stage-based progress indicator proves the AI is working while letting the user continue chatting.

**2. Proactive Insight Popup**

- **Decision**: When deep analysis finishes, show a floating chip (e.g., "💡 New Insight Available") rather than forcing a new message into the chat stream. Upon clicking, present the insight and ask if they want to explore the latest intelligence.
- **Rationale**: Interrupting the user mid-task leads to high dismissal rates. A subtle, interactive chip respects the user's workflow boundaries.

**3. Data Freshness Indicator**

- **Decision**: Add a relative timestamp ("Updated 5m ago") that degrades visually (e.g., turns amber and shows absolute time) when data crosses a staleness threshold.
- **Rationale**: Prevents "silent degradation" where users make decisions on outdated data.

**4. Pro Model Default**

- **Decision**: Override the default model selection for market analysis to prefer \`gemini-1.5-pro\` (or equivalent Pro model) for higher reasoning quality.

## Risks / Trade-offs

- **Risk: Intrusive Popups** -> Users might find the proactive insight generator annoying if it pops up too aggressively.
- **Mitigation**: Use the "mixed-initiative" chip approach. Let the user choose when to click and expand the insight rather than taking over their screen.
