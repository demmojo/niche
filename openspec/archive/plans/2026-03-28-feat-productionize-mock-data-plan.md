# Plan: Productionize Mock Data

## Enhancement Summary

**Deepened on:** 2026-03-28
**Sections enhanced:** 4
**Research agents used:** product-strategist, continual-learning, best-practices-researcher, architecture-strategist

### Key Improvements

1. **Model Upgrades:** Replaced deprecated Gemini 1.5 references with `gemini-3.1-flash` or newer models.
2. **Exa MCP Constraints:** Accounted for 2026 Exa MCP breaking changes (no API keys in URLs, `use_autoprompt` deprecated).
3. **Data Mutation & Concurrency:** Mandated Firestore `runTransaction` for HITL approvals and Append-Only SCD Type 2 modeling for canonical data.
4. **Async Polling:** Replaced HTTP polling with reactive Firestore `onSnapshot` listeners to reduce server load.

### New Considerations Discovered

- **Performance:** Require `Float32Array` scratchpads and `Math.log1p`/`Math.min(max)` cmov V8 optimizations for Node.js scoring.
- **Validation Strictness:** Zod v4.x schemas must strictly enforce `.min()` and `.max()` bounds. Do not use `.catch()` for drift protection; use `z.discriminatedUnion('schemaVersion', [...])`.
- **Frontend State:** Replace boolean soup (`isLoading`, `isError`) with strict discriminated unions for hook data fetching. Wrap components consuming former mock data in `<Suspense>`.
- **Security:** Run `replace(/[<>]/g, '')` on untrusted parameters interpolated into XML boundaries to prevent prompt structural overrides.

## 1. Executive Summary

Transition NicheAI from hardcoded `demoMockData.ts` to a live, production-ready data pipeline for competitive intelligence, Jobs-to-be-Done (JTBD), and sentiment insights. This plan adheres strictly to lean MVP constraints, Human-in-the-Loop (HITL) principles, and heuristics-first validation, moving NicheAI from a static prototype to an active market intelligence hub.

## 2. Strategic Context & Grounding

Based on recent codebase analysis:

- **Collision Warning:** The proposed `productionize-mock-data` effort intersects closely with existing specs like `raw-data-library` and `deduplication-algorithm`. We must ensure the HITL queue for this data pipeline acts as the unified ingestion point, feeding into the canonical `raw-data-library` without duplicating algorithmic deduplication logic.
- **Architectural Neighborhood:** This aligns heavily with the "Continuous Market Sentinel Mesh" and "Enterprise Knowledge Graph" roadmap items, serving as the foundational MVP for dynamic market data ingestion.

## 3. Strategic Guidelines

### Validating ML vs. Heuristics (Heuristics First)

- **Model Selection & Zero-Shot Extraction:** Rely exclusively on zero-shot/few-shot prompting. Use `gemini-3.1-flash` for high-throughput, low-complexity parsing (e.g., basic metadata extraction) and elevate to `gemini-3.1-pro` for critical, complex unstructured reasoning (e.g., Jobs-to-be-Done, nuanced sentiment analysis, and deep competitive insights).
- **Leeroopedia Extraction Best Practices:**
  - _Hypothesis Template Design:_ For extraction, wrap labels in meaningful context (e.g., "This text is about {label}") rather than using bare labels.
  - _Prompt Ensembling:_ Improve accuracy by averaging results across multiple prompt variations.
  - _Semantic Label Curation:_ Disambiguate class names in Zod schemas (e.g., `has_free_tier` instead of `free`) to reduce extraction confusion.
  - _Hierarchical Extraction:_ For large taxonomies (>50 categories), implement coarse-to-fine step extraction to avoid softmax flattening.
- **Heuristics for Scoring:** Challenge the urge to use predictive ML for scoring. Instead, use deterministic, weighted rules for computing `trustScore` and `competitorScore` (e.g., +10 for having a free tier, -20 for missing spam protection).
  - _Performance Consideration:_ Use pre-allocated `Float32Array` scratchpads for ML/heuristic scoring in Node.js to ensure deterministic execution, and leverage `Math.log1p` and `Math.min(max)` cmov V8 optimizations.
  - _Leeroopedia Scoring Framework:_ Define a rigorous metrics framework containing per-sample scoring, aggregation strategy, and directionality metadata. Apply softmax normalization across extraction scores to calibrate confidence.
- **Rapid Validation (Shadow Mode):** Begin by allowing users to manually paste competitor URLs (e.g., G2, Capterra) to validate extraction quality _before_ building complex, automated scraping orchestrators.

### Success Metrics (False Positive vs. False Negative UX)

- **Optimize for Precision over Recall:** A False Positive (e.g., hallucinated competitor feature) is a critical UX failure that destroys trust. A False Negative (missing a minor feature) is acceptable and can be manually corrected by the user.
- **Strict Validation:** Use strict Zod validation (v4.x) for all LLM outputs. Use top-level validators (e.g., `z.url()`), unified `error` parameters, and `z.treeifyError()` for capturing rejections. Use `z.discriminatedUnion('schemaVersion', [...])` to gracefully handle varying iterations of the prompt outputs over time instead of `.catch()`. Drop insights that fall below a high confidence threshold rather than guessing.
- **Security:** When interpolating untrusted parameters into XML prompt boundaries (like `<code_to_review>`), run `replace(/[<>]/g, '')` to prevent structural prompt overrides.
- **Core KPI:** Track the "Insight Rejection Rate" in the Taxonomy Queue / HITL Inbox to measure prompt performance over time.

### Designing for Uncertainty

- **HITL Integration (Taxonomy Queue):** All AI-generated insights must land in a Review Inbox / Taxonomy Queue. Users must explicitly accept, edit, or reject insights before they are written to the canonical knowledge graph in Firestore. Must use **Firestore `runTransaction`** instead of `updateDoc` + `onSnapshot` to prevent race conditions during concurrent merges.
- **Graceful Degradation:** Provide manual fallback UI states if scraping pipelines fail or APIs time out (e.g., "We couldn't parse this pricing page. Enter details manually to continue."). When replacing synchronous `demoMockData.ts` imports, update components consuming data to utilize `<Suspense>` or loading skeletons, and implement strict discriminated unions for hook data fetching rather than boolean soup (`isLoading`, `isError`). Abstract data fetching into unified contexts or custom hooks to maintain separation of concerns.

### Anti-Bloat / MVP Constraints (Niche over Horizontal)

- **Data Source Limit:** Restrict the MVP to the `user-exa` MCP (for search/metadata) and basic HTTP scraping. Defer complex external API integrations (e.g., Apollo, Clearbit). _Note: Use the official local SDK or Smithery infrastructure for Exa, as direct API keys in URLs and `use_autoprompt` are deprecated in 2026. Note that the 2026 Exa SDK includes `contents` by default in search operations, eliminating the need for secondary calls._
- **Just-in-Time Processing:** Do not pre-compute the entire market landscape. Use an Async Job Queue (returning `202 Accepted` with Firestore `onSnapshot` polling) triggered by explicit user actions to conserve compute credits and prevent memory exhaustion. The worker must utilize bounded concurrency and an `AbortSignal` listener to cancel inflight requests if the user navigates away or discards the job. Also, configure the API to handle Express 5.x 413 Payload Too Large errors.

## 4. Implementation Tasks

- [x] 1. Create Gemini prompts targeting `gemini-3.1-flash` (for metadata) and `gemini-3.1-pro` (for critical tasks like JTBD extraction). Incorporate Leeroopedia prompt ensembling and semantic label curation. Define strict Zod v4.x schemas matching `demoMockData.ts`. Ensure `.min()` and `.max()` bounds are explicitly set on all fields. Use top-level validators and `z.treeifyError()`. Apply `z.discriminatedUnion('schemaVersion', [...])` to schema models for handling future evolution. Use regex stripping for XML boundary parameters to prevent prompt injection.
- [x] 2. Implement an Async Job Queue worker to handle Exa searches and LLM extraction without blocking the main thread, adhering to the asynchronous polling pattern (`202 Accepted` returning `jobId` mapped to Firestore `onSnapshot`). Use bounded concurrency and an `AbortSignal` listener. Explicitly handle Express 5.x 413 Payload Too Large errors.
- [x] 3. Build the Taxonomy Queue UI to allow users to review, accept, or discard AI-generated insights, implementing Append-Only SCD Type 2 Taxonomy models for safe rollbacks. Ensure that users must use **Firestore `runTransaction`** to merge data from the queue to the canonical store to prevent race conditions. Score with pre-allocated `Float32Array` scratchpads for ML/heuristic scoring in Node.js utilizing `Math.log1p` and `Math.min(max)` cmov V8 optimizations.
- [x] 4. Replace `demoMockData.ts` imports with dynamic Firestore queries fed by the HITL queue output. Ensure all new data-fetching hooks use strict discriminated unions (e.g., `{ status: 'idle' } | { status: 'loading' } | { status: 'success', data: T }`) and ensure `useTransition` is used properly if updating state post-fetch. Use loading skeletons or `<Suspense>` across affected UI.
