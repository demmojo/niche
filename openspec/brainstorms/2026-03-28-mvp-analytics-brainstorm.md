# 4-Event MVP Analytics Brainstorm

**Date:** 2026-03-28

## What We're Building

A highly-focused, lean telemetry strategy for the NicheAI MVP. This strategy ignores vanity metrics (page views, session lengths) and strictly measures "Problem Resonance"—proving that founders are actually getting value from the competitive intelligence we provide to help them find a niche and escape horizontal tarpits.

## The 4-Event Analytics Model

### 1. Activation: Competitor Ingestion Completed

- **Location:** Backend (`src/server/queues.ts`) processing `network-io-queue` or `vision-ml-queue`.
- **Trigger:** User completes an initial async extraction job via the `UnifiedIdeationEngine`.
- **The "Why":** Framing an idea against the market proves they are using the platform as an intelligence tool rather than a generic notepad.
- **Drop-off Diagnosis:** High drop-off after this means the extracted data was likely too generic or validated their imposter syndrome without offering a clear "Blue Ocean" pivot.
- **Payload Schema:** `eventId`, `schemaVersion: 'v1'`, `projectId`, `competitorCount`, `featuresExtractedCount`, `durationMs`

### 2. Core Action: Market-Driven Sync Commit

- **Location:** Frontend (`src/components/SyncReviewModal.tsx`).
- **Trigger:** User opens the `SyncReviewModal` and clicks "Commit" to apply an AI-proposed `SyncDiff` to their project.
- **The "Why":** The user is actively mutating their product's DNA based on real external data. This physically proves the core value proposition.
- **Drop-off Diagnosis:** If they commit but never return, the insight provided was a "novelty fact" rather than a strategic imperative.
- **Payload Schema:** `eventId`, `schemaVersion: 'v1'`, `projectId`, `acceptedDiffsCount`, `rejectedDiffsCount`, `entityTypesMutated`

### 3. Retention Proxy: Lens Agent Evaluated

- **Location:** Frontend (`src/components/lens/LensStrategyConsole.tsx`).
- **Trigger:** User interacts with the `LensStrategyConsole` and explicitly clicks "Reject" or "Accept" on a pivot suggestion.
- **The "Why":** Active interaction (especially rejection) proves they care enough about their niche to correct and train the AI Co-Founder. Rejection proves high-intent curation.
- **Drop-off Diagnosis:** If they take time to train the agent but don't return, it means the system failed to learn and subsequent suggestions were still poor.
- **Payload Schema:** `eventId`, `schemaVersion: 'v1'`, `projectId`, `suggestionType`, `outcome: 'accepted' | 'rejected'`, `rejectionReason`, `dataFingerprint`, `textLength` (PII sanitized).

### 4. Revenue Signal: Compute Upgrade (BYOK / Credits)

- **Location:** Backend (`src/server/byokMiddleware.ts` within `saveByokKey`).
- **Trigger:** User hits their free Action Credit limit (Paywall Impression) and inputs a credit card or BYOK API key (Compute Upgrade).
- **The "Why":** Upgrading compute to track competitors proves the data is painful to lose and tied to business survival.
- **Drop-off Diagnosis:** If they pay but usage flatlines, ongoing market signals aren't volatile enough to warrant continuous monitoring.
- **Payload Schema:** `eventId`, `schemaVersion: 'v1'`, `projectId`, `upgradeType`, `provider`

## Why This Approach (Architecture Decisions)

1.  **YAGNI Simplicity:** We opted against BullMQ workers or a Dead Letter Queue (DLQ) for telemetry. The frontend will hit a `POST /api/v1/ui-sync` endpoint which will perform a direct, synchronous `.set()` to Firestore. Validation failures drop the event and return 400.
2.  **Context Parity & Agent-Native Safety:** The telemetry payloads enforce an `actorType: 'human' | 'agent' | 'system'`. The frontend will check `window.__AGENT_SESSION__` to ensure our own AI testing agents don't pollute the human analytics data.
3.  **Data Integrity:** Replaced `addDoc` with `.create()`/`.set()` using client-generated UUIDs (`eventId`) to ensure idempotency. Used Zod `discriminatedUnion` for strict `schemaVersion`ing. Disabled automatic timestamp indexing in Firestore to prevent the 500 writes/sec hotspot bottleneck.
4.  **Frontend Performance:** Implemented a robust `TelemetryBatcher` class for React. It uses synchronous pushes to a queue, but defer-flushes the network `fetch` via `requestIdleCallback`. Includes a critical `dispose()` method to prevent React unmount memory leaks. Used `/api/v1/ui-sync` pathing to bypass aggressive ad-blockers.

## Open Questions

- How should we visualize the "Tarpit Escape Velocity" cohort chart in Mixpanel/Amplitude given these precise events?
- Should the "Paywall Impression" (Step 3.5) be its own dedicated event, or just a property on a generic UI event?

## Next Steps

This brainstorm captures the WHAT and WHY. To move to execution, run `/workflows:plan` against this file to generate the implementation spec.
