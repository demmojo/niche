# Design: Enterprise ML Orchestration and Prompt System

## Context

This architectural design establishes the NicheAI internal Machine Learning orchestration layer. It codifies rules for capability-driven model routing, structured fallback handling, and robust async executions required for complex reasoning models.

## Goals

- Provide a unified interface for selecting and communicating with varied LLM tiers.
- Prevent main Node.js event loop blocking (starvation) during long-running reasoning.
- Ensure mathematical validity of prompt improvements through A/B testing and rigorous automated judgments.
- Establish highly-auditable, easily-rollbackable state via explicit ML versioning.

## Non-Goals

- Synchronous real-time response for multi-step or agentic Pro-tier loops.
- Training or fine-tuning our own foundational models.

## Decisions

- **Google Cloud Tasks + Firestore Claim Check:** Selected over BullMQ/Redis and in-memory alternatives to guarantee task persistence, serverless scale-to-zero compatibility, and graceful scale-out. Worker endpoints hold HTTP 202 requests open to ensure CPU allocation.
- **Firestore SCD Type 2:** Selected an Append-Only Slow Changing Dimensions schema to maintain an absolute history of ML configurations.
- **Tri-Modal Validation Waterfall:** To minimize LLM API costs during evaluation, scoring strictly proceeds through deterministic (JSON/Zod AST syntax), semantic (Embedding similarity), and heuristic (LLM-as-a-Judge) phases. Early failure short-circuits the rest.
- **Adaptive Routing (Thompson Sampling):** Selected to smartly shift traffic dynamically between competing Champion and Challenger prompts based on performance.

## Risks & Trade-offs

- **Node.js Memory Exhaustion:** Append-only configuration arrays in Firestore risk memory bloat via realtime sync. _Mitigation_: Strictly bounding the `.onSnapshot` query to active statuses and open expiration dates.
- **Firestore Write Contention:** Rapid weight updates during MAB evaluation can hit Firestore write limits. _Mitigation_: Offloading counter state to Firestore Distributed Counters (or Redis atomic `INCR`), subsequently flushed to the main doc via a 5-minute CRON job.
- **Cloud Tasks Constraints:** Payload limits (100KB) and timeout limits (30min). _Mitigation_: Implement the Claim Check pattern via `cloud_tasks_payloads` Firestore collection, and configure worker timeouts strictly.
- **Backward Compatibility:** Existing clients expect synchronous responses. _Mitigation_: Legacy `/v1/` endpoints will temporarily wrap the `/v2/async` job, resolving synchronously to preserve backward compatibility during the transition.

## Future Potential

- **Superadmin Validation Arena:** Building am-ELO (Annotator-Modified ELO) dashboards to review system decisions with human-in-the-loop overrides.
