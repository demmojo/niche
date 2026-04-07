# Proposal: Hybrid Data Moat Architecture (JIT Flywheel)

## Why

To preserve the "Reverse Demo Hook" Product-Led Growth (PLG) motion while aggressively building a proprietary dataset. We need a system that does not hang the UI on long LLM generation times and natively captures high-fidelity proprietary data (pivots, manual corrections, binary feedback). Crucially, the dataset must compound: future users searching known tarpits should instantly hit a cached warning, creating a true flywheel.

## What Changes

1. **Decouple the Offline Baseline:** Tag the existing 100k BigQuery offline baseline with data provenance to distinguish it from organic demand.
2. **JIT Flywheel Route (Cache-Hit First):** Introduce a Two-Phase Fetch (Server-Sent Events) hot path. It first checks for a known high-demand tarpit to return instantly. If unknown, it streams Exa results while Gemini processes.
3. **Asynchronous Collision Engine:** Shift heavy ML tagging and collision tracking to GCP Cloud Tasks using the Claim Check Pattern. Use Firestore Distributed Counters to prevent write hotspotting on viral niches.
4. **Frontend Telemetry:** Overhaul UI workflows to implicitly and explicitly capture user corrections, pivot decisions, and validation signals as optional power-user features to avoid funnel friction.

## Capabilities

- Instant cache-hits for known tarpit ideas.
- Real-time Exa search results streaming to users for net-new ideas.
- Background LLM enrichment without penalizing user experience.
- Secure, resilient async payload handling via Cloud Tasks with idempotent claim-check processing.

## Impact

Drastically improved UI responsiveness, automated creation of a rich bipartite graph (User Idea <-> Competitor), and a compounding data moat where past user searches instantly de-risk future founders.
