# Proposal

## Why

Currently, our `Tarpit Analyzer` and Visual Intelligence Pipeline rely on mocked data, naive keyword matching, or stochastic multimodal LLMs. For enterprise technical due diligence (M&A), stochastic AI evaluations and undocumented data retention are liabilities. Acquirers demand auditable decision trails, defensibility via proprietary data, and compliance with data provenance laws (like the EU AI Act). Standard semantic clustering creates false positives, penalizing highly specific, defensible niches because they share a high-dimensional neighborhood with horizontal behemoths.

## What Changes

We are replacing stochastic LLM "vibes" with a mathematically rigorous Hybrid Scoring Engine.

1. **Deterministic Scoring**: An LLM structurally parses competitor websites into standardized JSON containing a `_reasoning` field, followed by Gemini 768D vectorization and Apollo competitor density checks.
2. **Tarpit Data Flywheel**: A background worker asynchronously clusters user queries into proprietary embeddings using $O(N)$ streaming algorithms to identify dense horizontal tarpits.
3. **M&A Compliance**: Implementation of a 30-day Time-To-Live (TTL) on ingested data via PostgreSQL Table Partitioning and Continuous Distillation.

## Capabilities

- **Niche Viability Score**: Calculated deterministically via `(Vector Uniqueness * 0.4) + (Apollo Competitor Count * 0.6)`.
- **False Positive Prevention**: Uses Orthogonal Vector Distance (the "Wedge Metric") and Local vs. Global Density to distinguish hyper-specific niches from saturated horizontals.
- **Source Record Attribution**: Every scored feature links directly to the verbatim text quote and Exa URL.

## Impact

This engine strictly enforces a "Niche over Horizontal" product vision, safely steering founders away from tarpits. It completely de-risks the platform for enterprise M&A by providing explainable, reproducible due diligence trails and compliant data lifecycle management.
