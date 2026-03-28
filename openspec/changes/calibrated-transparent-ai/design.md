# Design: Calibrated Transparent AI

## Context

The implementation leverages our existing Express BFF, Task Queues, and React/Zustand frontend architecture. We rely on external LLM providers (Gemini, Anthropic, OpenAI) and data sources (Exa, Apollo) which require strict data sanitization and provenance tracking.

## Goals

- Cryptographically verify ZDR for sensitive inputs.
- Force inline citations for RAG-assisted LLM outputs.
- Provide interactive visualizations of AI decision-making criteria.
- Grant users granular control over background agent workflows.

## Non-Goals

- Open-sourcing the underlying NicheAI codebase or model weights.
- Building our own foundational LLM (we will strictly rely on API providers' ZDR enterprise tiers).

## Decisions

- **SHA-256 ZDR Receipts (Provider Attestation):** A one-way hash combining the raw prompt, a secure timestamp, and the specific transaction ID/headers returned by the LLM provider (e.g., `x-request-id` or `x-amzn-bedrock-invocation-id`) to mathematically prove the provider respected the zero-retention flag.
- **Inline Markdown Tags:** The backend will mandate `<cite id="...">` tags during LLM generation to map directly to frontend `CitationMap` Zustand stores.
- **Score Breakdown Heuristics:** The system will use an additive score decomposition (e.g. intercept + Σ feature_contributions) combining heuristic-based scoring for fast, interpretable metrics to isolate the top-5 drivers for transparent rationale.
- **Pure Frontend Counterfactual Math:** The backend will return a base payload of additive heuristic weights (e.g., `{ base_score: 85, drivers: [{ name: "Market Size", weight: 0.4, current_val: 10 }] }`). The React frontend will recalculate the score synchronously when the slider moves (`new_score = base_score + (delta * weight)`), eliminating expensive backend LLM calls, batching, and caching.
- **RAG Context Management:** We will enforce a 4 chars/token heuristic estimate with a 100-token safety margin below the provider limit. If retrieved context overflows, we will employ a "Middle-Truncation" strategy (removing content from the middle of the document to preserve critical start metadata and end conclusions).
- **Stateless `PENDING_CONSENT` Queues (Firestore):** Instead of pausing background tasks in-memory in Express `queues.ts` (which is stateful and fragile), tasks requiring consent will write a document to a `Tasks` Firestore collection with `status: "PENDING_CONSENT"` and gracefully exit. The frontend will update the status to `QUEUED` upon approval, triggering the final execution.
- **Firestore-Backed Audit Log:** `useActionAuditStore` will not be a local circular buffer that wipes on refresh. It will act as a projection of a live Firestore query (`query(auditLogsRef, orderBy('createdAt', 'desc'), limit(50))`).

## Risks & Trade-offs

- **Risk:** Token exhaustion. Injecting detailed metadata (URLs, snippets) for RAG provenance increases context size.
  - **Mitigation:** Implement a middle-truncation strategy and attach provenance metadata (e.g., chunk IDs) as lightweight pointers, injecting only the necessary context while preserving the start and end of retrieved documents.
- **Risk:** UX Friction in Co-Pilot mode.
  - **Mitigation:** Batch proposed actions into consolidated Audit Log prompts to avoid overwhelming users with consent requests.

## Future Potential

Establishing this Trust framework allows us to safely scale Agentic AI features (e.g., auto-emailing leads, auto-updating landing pages) because the infrastructure for user consent and provenance is already deeply integrated into the platform.
