# Design: Hybrid Data Moat Architecture

## Context

NicheAI relies on both deep offline baseline analysis and real-time user-driven inquiries. To build an unassailable data moat, we must capture real-world user interactions (the "JIT" phase) and use them to serve instant warnings to future users, all without breaking the application's perceived performance.

## Goals

- Establish a Cache-Hit first approach for known tarpits.
- Establish a Two-Phase Fetch (SSE) for fast data retrieval on net-new ideas.
- Delegate heavy caching and indexing to a background Cloud Task idempotently.
- Capture explicit user pivot data and AI constraint updates without adding funnel friction.

## Non-Goals

- We are NOT building real-time AI semantic gatekeepers or complex staging quarantines (premature scaling). Data cleaning will happen asynchronously/offline.
- We are not deprecating the offline BigQuery pipeline; this complements it.

## Decisions

1. **Cache-Hit First:** Before executing expensive Exa/Gemini calls, query `founder_demand_queries` or `tarpit_centroids`. If a known massive tarpit matches, instantly return the cached intelligence.
2. **Two-Phase Fetch (SSE):** For net-new queries, use SSE with `X-Accel-Buffering: no` to stream deterministic Exa results, keeping the user engaged while Gemini parses complex data.
3. **Claim Check Pattern with Idempotency:** Cloud Tasks limits payloads to 100KB. We write heavy payloads to `cloud_tasks_payloads`, pass the ID to the task, and delete it in the exact same `WriteBatch` that processes the data. We also use a TTL of 24h on the payloads collection to sweep orphans.
4. **Distributed Counters for Collision Engine:** To prevent Firestore `DEADLINE_EXCEEDED` errors during viral niche events, we will NOT rely on Cloud Tasks backoff for 1 write/sec limits. We will use a randomized Distributed Counter shard (e.g., 0-9) to increment `demand_score`.
5. **Express 5.x SSE Error Handling:** We will keep `try/catch` blocks INSIDE the SSE chunk loop. Bubbling errors after headers are sent causes Express 5 to crash the worker.

## Risks & Trade-offs

- **Risk:** SSE connections dropping mid-stream.
  **Mitigation:** Bind an `AbortController` to the `req.on('close')` event and pass the signal to Gemini and Exa SDKs to cancel downstream requests immediately.
- **Risk:** Prompt Injection and NoSQL Injection.
  **Mitigation:** Use `.strict()` on all Zod schemas and apply `replace(/[<>]/g, "")` on textual inputs _before_ passing them to Gemini or Firestore.
