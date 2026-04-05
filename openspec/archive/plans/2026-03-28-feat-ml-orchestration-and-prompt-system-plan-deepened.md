---
title: "feat: ML Orchestration, Model Routing, and Prompt Engineering System"
type: feat
status: active
date: 2026-03-28
---

# ML Orchestration, Model Routing, and Prompt Engineering System

## Enhancement Summary

**Deepened on:** 2026-03-28
**Research agents used:** `best-practices-researcher`, `architecture-strategist`

### Key Improvements

1. **Self-Learning Loop (Champion-Challenger):** Integrated a mathematically sound validation engine using Paired Student's t-tests to mathematically prove Challenger prompt/model configurations against Champions before deployment.
2. **Advanced ML Versioning:** Adopted an Append-Only SCD (Slowly Changing Dimensions) Type 2 architecture in Firestore for strict, auditable versioning of ML components.
3. **Gold Standard Validation:** Added a Tri-Modal scoring pipeline (Deterministic Zod, Semantic Gemini 768D embeddings, Heuristic LLM-as-a-Judge) running against a curated, real-life "Gold Standard" dataset.
4. **Adaptive Routing & Evaluation:** Incorporated Multi-Armed Bandits (MAB) for dynamic routing and am-ELO (Annotator-Modified ELO) for Human-In-The-Loop (HITL) prompt grading.

---

## Overview

This document outlines the architectural implementation of NicheAI's internal Machine Learning systems. It codifies the rules for model selection, capability-driven routing, prompt engineering best practices based on Leeropedia standards, and a **mathematically validated self-learning loop**. It replaces static model selection with a dynamic, cost-efficient, and continuously improving orchestration layer.

## Problem Statement / Motivation

Currently, the NicheAI codebase lacks a unified, dynamic system for selecting LLMs based on the specific task. Hardcoding models leads to API failures, suboptimal performance, and wasted tokens. Furthermore, prompt engineering needs to be standardized using the CO-STAR framework.

Crucially, the system lacks a **feedback loop**. When prompts or models are updated, there is no mathematical proof that the change is actually an improvement ("prompt debt"). We need a robust self-learning system that utilizes real-world telemetry to curate "Gold Standard" test sets and statistically validates every ML change.

## Proposed Solution

1. **Capability-Driven Smart Routing:** Semantic routing (`Capability`) mapping tasks to model tiers (Lite, Fast, Pro) using Multi-Armed Bandits (MAB) for adaptive traffic distribution between prompt variants.
2. **CO-STAR Prompt Standardization:** Enforce the CO-STAR framework for all prompt generation.
3. **Structured Outputs & AST Sanitization:** Mandate native Zod JSON schemas for extraction and AST-based sanitization for fallbacks.
4. **Asynchronous ML Orchestration:** Enforce the HTTP 202 Accepted pattern with bounded concurrency to protect the V8 thread.
5. **Mathematically Validated Self-Learning System:** Implement a Champion-Challenger architecture where proposed ML configurations must pass a Paired Student's t-test against a curated Gold Standard dataset before promotion.
6. **Immutable ML Versioning:** Use Firestore Append-Only SCD Type 2 to track every prompt, schema, and routing rule configuration perfectly.

## Technical Approach

### Architecture

#### 1. The Model Tiering System (Smart Routing & MAB)

Models are categorized into three tiers based on capability:

- **Lite Tier (`gemini-3.1-flash-lite-preview`)**: High-volume data extraction, structured JSON parsing. Lowest latency/cost.
- **Fast Tier (`gemini-3.1-flash`)**: Standard interactions, balanced speed/reasoning. The default workhorse.
- **Pro Tier (`gemini-3.1-pro-preview`)**: Complex problem-solving, multi-step agentic reasoning, and **LLM-as-a-Judge evaluations**.

_Adaptive Routing (MAB)_: In `aiClient.ts`, the router checks Firestore for active prompt experiments. It uses Thompson Sampling to dynamically shift traffic to the winning prompt variant based on its current success weights, minimizing the "regret" of serving bad outputs.

#### 2. Prompt Engineering Standards (CO-STAR & Registry)

All system prompts must be assembled using the **CO-STAR Framework** (Context, Objective, Style, Tone, Audience, Response) and explicitly define XML-like boundaries for constraints.

- **The Prompt Registry Pattern**: Prompts are treated as stable API endpoints, never loose strings. A prompt version is an immutable "commit" containing:
  1. The CO-STAR Template.
  2. Model Config (Tier, Temperature).
  3. The Expected Zod Schema.

#### 3. Systematic ML Versioning (Firestore SCD Type 2)

We use an Append-Only SCD Type 2 design for ML assets to guarantee auditability and instant rollbacks.

- **Collection:** `ml_configs`
- **Schema Fields:** `configId`, `version`, `status` (`draft`, `evaluating`, `champion`, `archived`), `tier`, `modelParams`, `promptTemplate`, `validFrom`, `validTo`.
- Application code routes requests using stable aliases (e.g., `@production` resolves to the current `champion`), cached in memory and updated via Firestore `onSnapshot`.

#### 4. "Gold Standard" ML Testing Pipeline (Node.js Worker)

To prevent regressions, async background workers run Challenger configs against a "Gold Standard" dataset containing real-life inputs and curated ideal outputs.

**Tri-Modal Scoring Mechanism:**
Every output is scored (0.0 to 1.0) across three dimensions:

1.  **Deterministic (Syntax):** Parsed via Zod. `1.0` if perfect, `0.0` if schema drift or injection is detected.
2.  **Semantic (Embedding Similarity):** Uses Gemini 768D embeddings to calculate Cosine Similarity against the expected output. _Strictly uses pre-allocated `Float32Array` scratchpads on the main thread, avoiding `SharedArrayBuffer` GC overhead._
3.  **Heuristic (Autorubric LLM-as-a-Judge):** `gemini-3.1-pro-preview` acts as the judge, evaluating the output against binary/ordinal rubrics (e.g., "Does this identify 3 sub-niches?").

#### 5. Mathematically Sound Validation Engine (Champion-Challenger)

Before a Challenger becomes a Champion, it must be mathematically proven.

1.  The Evaluation Engine collects Tri-Modal scores for both Champion and Challenger across $N$ Gold Standard examples.
2.  **The Math:** A **Paired Student's t-test** (or Wilcoxon signed-rank test) runs directly in Node.js.
    - _Null Hypothesis ($H_0$):_ The Challenger is no better than the Champion.
3.  **The Gate:** If `mean(Challenger) > mean(Champion)` AND `p-value < 0.05` (95% confidence), the Challenger is proven.
4.  **Promotion:** Using `firestore.runTransaction()`, the system atomically archives the old Champion and promotes the Challenger, ensuring concurrent HITL safety.

#### 6. Execution & Orchestration

- **Concurrency Control:** `p-queue` (max 5-10 concurrent) for extraction bursts.
- **Zero Data Loss:** `workerId` leasing and 30s heartbeats via `FieldValue.serverTimestamp()` for async evaluations.
- **Failover Logic:** Exponential backoff + jitter for HTTP 429s.

## PLG & Cognitive Load Strategy

- **Reverse Demo Hook:** Auto-routing hides complexity from users.
- **Superadmin Validation Arena:** Built into the dashboard, this surface allows superadmins to view side-by-side anonymized outputs. The system uses **am-ELO (Annotator-Modified ELO)** to weight human pairwise votes based on historical annotator reliability, feeding this back into the MAB router.
- **Data Flywheel (Auto-Curation):** Implicit user telemetry (e.g., accepting an AI-generated niche without edits, rating it 5 stars) automatically promotes real-life examples into the `gold_standard_evals` Firestore collection, continuously tightening the evaluation loop.

## Acceptance Criteria

### Functional Requirements

- [ ] `aiClient.ts` routes requests based on the `Capability` enum and Multi-Armed Bandit weights.
- [ ] `ml_configs` Firestore collection implemented with SCD Type 2 versioning.
- [ ] Gold Standard Async Worker implemented with Tri-Modal Scoring (Zod, Gemini 768D `Float32Array` embeddings, Pro LLM-Judge).
- [ ] Paired Student's t-test utility implemented for Challenger promotion gating.

### Quality Gates

- [ ] Intent-based tests written using MSW to verify fallback chains and 429 exponential backoff.
- [ ] Transactional safety (`runTransaction`) confirmed for Champion promotion.
- [ ] All `Float32Array` scoring functions execute synchronously under 10ms to protect the V8 thread.

## References & Research

- **Internal Rules:** `.cursor/rules/ml-engineering-standards.mdc`
- **Academic Frameworks:** am-ELO (Annotator-Modified ELO), Autorubric evaluation methodologies, Thompson Sampling for MAB.
- **ML Best Practices:** TensorZero adaptive experimentation, SCD Type 2 Database Design.
- **Prompt Framework:** CO-STAR (Context, Objective, Style, Tone, Audience, Response)
