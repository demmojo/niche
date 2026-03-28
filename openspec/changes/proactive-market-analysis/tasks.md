> **CRITICAL DEPENDENCY**: The Chat UX tasks (Section 4) MUST be implemented AFTER the `multi-category-mentions` OpenSpec. `multi-category-mentions` migrates the `InsightBrainstormChat.tsx` component to a headless Tiptap DOM structure. Building the proactive analysis UI features on top of the old `<textarea>` will cause severe merge conflicts and require complete rework.

## 1. Data Freshness & Sync Prompt

- [x] 1.1 Add logic to detect if data is empty/stale and prompt the user to sync.
- [x] 1.2 Implement a Data Freshness indicator component in the Market Analysis header.

## 2. Sync Progress Banner

- [x] 2.1 Hook into the global `useSyncQueue` or sync state to get real-time progress. (Note: Ensure this aligns with the asynchronous backend processing introduced in `raw-data-library`).
- [x] 2.2 Build a non-blocking `SyncProgressBanner` component to display current actions (Grounding, AI Analysis).

## 3. Proactive Insight Popup

- [x] 3.1 Implement a floating "New Insight Available" chip that appears when background deep analysis finishes.
- [x] 3.2 Create the flow where completing/canceling the popup triggers a new chat message from Burt asking to explore the new data.

## 4. Chat UX & Pro Models

- [x] 4.1 Update the AI client call in `MarketAnalysis.tsx` to explicitly request a Pro model.
- [x] 4.2 Refine the inline UI cards for generated features/insights to be more modern and actionable. (Wait for `multi-category-mentions` Tiptap integration).
