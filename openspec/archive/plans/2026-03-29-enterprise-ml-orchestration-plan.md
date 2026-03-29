---
title: "feat: Enterprise ML Orchestration and Prompt System"
type: feat
status: active
date: 2026-03-29
supersedes: ["ml-orchestration-and-routing"]
---

# Enterprise ML Orchestration and Prompt System

## Enhancement Summary

**Deepened on:** 2026-03-29
**Research agents used:** `best-practices-researcher`, `framework-docs-researcher`, `architecture-strategist`, `code-simplicity-reviewer`, `pattern-recognition-specialist`, `product-strategist`

### Key Improvements

1. **Hardened Redis/BullMQ Asynchronous Architecture:** Upgraded from the fragile in-memory `p-queue` to a distributed, persistent queuing system (BullMQ) using Sandboxed Processors to protect the V8 event loop. Enforces the HTTP 202 Accepted pattern for long-running Pro-tier tasks.
2. **Advanced ML Versioning & Data Governance:** Maintained Append-Only SCD (Slowly Changing Dimensions) Type 2 architecture in Firestore with bounded subscriptions to prevent OOM errors.
3. **Adaptive Routing (Multi-Armed Bandits):** Retained dynamic routing using Thompson Sampling, enhanced with Redis atomic counters to prevent Firestore write contention, mathematical decay for model drift, and a forced exploration threshold for the "Cold Start" problem.
4. **Gold Standard Validation Engine:** Tri-Modal scoring pipeline is now a "Short-Circuit Waterfall" to save API costs, using `gemini-embedding-001` (deprecating `004`), and Pairwise Dueling Bandits with randomized positioning for the LLM Judge to prevent verbosity/position bias.
5. **Product-Led Growth (PLG) & Data Flywheel:** Implemented the "Reverse Demo Hook" (PQL gate mapped to the Pro tier) and updated telemetry to track the "Delta" (AI output vs. User Edits) with PII-scrubbing hooks (to be reviewed by legal).

---

## Overview

This document outlines the architectural implementation of NicheAI's internal Machine Learning orchestration layer. It codifies the rules for model selection, capability-driven routing via Multi-Armed Bandits, prompt engineering best practices based on Leeropedia standards, a Redis-backed async execution layer, and a mathematically validated self-learning loop.

## Problem Statement / Motivation

Currently, the NicheAI codebase lacks a unified, dynamic system for selecting LLMs. Hardcoding models creates brittleness, suboptimal performance, and wasted tokens. Furthermore, prompt engineering lacks standardization, and there is no feedback loop to mathematically prove that prompt changes actually improve output quality.

We need an enterprise-grade self-learning system that utilizes real-world telemetry (with PII scrubbing) to curate "Gold Standard" test sets, statistically validates every ML change before deployment, and safely orchestrates long-running tasks via persistent queues.

## Proposed Solution

1. **Capability-Driven Smart Routing:** Semantic routing (`Capability`) mapping tasks to model tiers (Lite, Fast, Pro) using Multi-Armed Bandits (MAB) for adaptive traffic distribution between prompt variants.
2. **CO-STAR Prompt Standardization:** Enforce the CO-STAR framework for all prompt generation.
3. **Structured Outputs & AST Sanitization:** Mandate native Zod JSON schemas for extraction using `z.discriminatedUnion` and AST-based sanitization for fallbacks.
4. **Enterprise Asynchronous Orchestration:** Enforce the HTTP 202 Accepted pattern using a Redis-backed **BullMQ** queue with Sandboxed Processors for heavy ML tasks, preventing V8 thread blocking and memory exhaustion.
5. **Mathematically Validated Self-Learning System:** Implement a Champion-Challenger architecture where proposed ML configurations must pass a Paired Student's t-test (`@stdlib/stats-ttest`) against a curated Gold Standard dataset.
6. **Immutable ML Versioning:** Use Firestore Append-Only SCD Type 2 to track every prompt, schema, and routing rule configuration perfectly.
7. **PII-Scrubbed Telemetry Flywheel:** Implement an automated telemetry pipeline that scrubs Personally Identifiable Information before adding high-quality user deltas to the evaluation dataset.

## Technical Approach

### Architecture

#### 1. The Model Tiering System (Smart Routing & MAB)

Models are categorized into three tiers based on capability, using abstract aliases (e.g., `Tier.LITE`) rather than hardcoded strings:

- **Lite Tier (`gemini-3.1-flash-lite-preview`)**: High-volume data extraction, structured JSON parsing. Lowest latency/cost.
- **Fast Tier (`gemini-3.1-flash`)**: Standard interactions, balanced speed/reasoning. The default workhorse.
- **Pro Tier (`gemini-3.1-pro-preview`)**: Complex problem-solving, multi-step agentic reasoning, and **LLM-as-a-Judge evaluations**.

*Adaptive Routing (MAB)*: 
- Extracts Thompson Sampling and routing logic into a separate `PromptBanditOptimizer` to preserve Separation of Concerns.
- Uses Redis atomic `INCR` to track success/failure weights in real-time, flushing to Firestore via a CRON job every 5 minutes to prevent Firestore write contention.
- Implements a mathematical decay factor to handle model drift and a forced exploration threshold for new prompts (Cold Start).

#### 2. Prompt Engineering Standards (CO-STAR & Registry)

All system prompts must be assembled using the **CO-STAR Framework** (Context, Objective, Style, Tone, Audience, Response) and explicitly define XML-like boundaries for constraints. For Judges, Chain-of-Thought (CoT) reasoning is strictly required before outputting the final score.

#### 3. Systematic ML Versioning (Firestore SCD Type 2)

We use an Append-Only SCD Type 2 design for ML assets to guarantee auditability and instant rollbacks.

- **Collection:** `ml_configs`
- **Schema Fields:** `configId`, `version`, `status` (`draft`, `evaluating`, `champion`, `archived`), `tier`, `modelParams`, `promptTemplate`, `validFrom`, `validTo`.
- **Bounded Subscriptions:** The caching `onSnapshot` query is strictly bounded (`.where('status', 'in', ['champion', 'evaluating']).where('validTo', '==', null)`) to prevent Node.js OOM errors from an infinitely growing append-only history.

#### 4. Asynchronous Execution (BullMQ & Redis)

Long-running LLM workflows (especially Pro tier multi-step reasoning) must not block the main Node.js event loop.
- Incoming heavy requests respond immediately with `202 Accepted` and a `jobId`.
- The task is pushed to a Redis-backed BullMQ queue.
- **Sandboxed Processors** running in separate child processes execute the LLM calls, emitting granular `job.updateProgress()` updates.
- **Resiliency:** `lockDuration` is tuned to 120s to prevent duplicate execution of long LLM calls. BullMQ limits redis memory bloat via `removeOnComplete: true`.
- The client subscribes to the Firestore document (via `onSnapshot`) to receive the result, explicitly handling the React 19 "Snapshot Beats the Fetch" race condition.

#### 5. "Gold Standard" ML Testing Pipeline & Self-Learning

To prevent regressions, async background workers run Challenger configs against a "Gold Standard" dataset.

**Tri-Modal Short-Circuit Waterfall:**
Every output is scored sequentially to save API costs:
1.  **Deterministic (Syntax):** Parsed via Zod `z.discriminatedUnion`. If failed, score 0 and abort.
2.  **Semantic (Embedding Similarity):** Uses the `gemini-embedding-001` model to calculate Cosine Similarity against the expected output using `Float32Array` scratchpads. If below threshold, abort.
3.  **Heuristic (Pairwise Dueling Bandit LLM-Judge):** `gemini-3.1-pro-preview` compares Champion vs Challenger ("Which is better?") with randomized positioning to neutralize Position/Verbosity bias.

**Mathematical Validation (Champion-Challenger):**
A Paired Student's t-test (`@stdlib/stats-ttest`) runs to prove the Challenger is significantly better (`p-value < 0.05`) before atomic promotion via `firestore.runTransaction()`.

## PLG, Telemetry, & Compliance

- **Reverse Demo Hook & PQL Gates:** Auto-routing provides instant value via Lite/Fast tiers for unauthenticated users. Deep analysis requiring the Pro Tier async queue acts as a Product Qualified Lead (PQL) gate.
- **Superadmin Validation Arena:** Built into the dashboard, this surface allows superadmins to view side-by-side anonymized outputs using **am-ELO (Annotator-Modified ELO)** weighting.
- **Data Flywheel (Tracking the Delta):** Instead of implicit acceptance, the system tracks the *diff* between the AI's generation and the user's manual edits. This delta triggers an async job that scrubs the data of PII via regex heuristics (to be reviewed by Legal) before promoting the real-life example into the `gold_standard_evals` Firestore collection.

## Acceptance Criteria

### Phase 1: Infrastructure & Queuing
- [ ] Redis/BullMQ infrastructure is provisioned with Sandboxed Processors (`concurrency: 5`), `lockDuration: 120000`, and `removeOnComplete: true`.
- [ ] HTTP 202 async endpoints implemented, ensuring graceful degradation for UI fallbacks.
- [ ] BullMQ `on('failed')` terminal states are explicitly written to Firestore to prevent client-side hanging.

### Phase 2: Database & Routing (MAB)
- [ ] `ml_configs` Firestore collection implemented with SCD Type 2 versioning and bounded `onSnapshot` queries.
- [ ] `PromptBanditOptimizer` separated from `aiClient.ts`, using Redis atomic `INCR` for Thompson Sampling weights, mathematical decay, and forced exploration logic.
- [ ] Zod `z.discriminatedUnion` implemented for deterministic JSON extraction.

### Phase 3: Validation, Promotion & Telemetry
- [ ] Tri-Modal Short-Circuit Waterfall implemented utilizing `gemini-embedding-001` and Pairwise Dueling Bandits.
- [ ] `@stdlib/stats-ttest` Paired Student's t-test utility implemented for Challenger promotion gating via `runTransaction`.
- [ ] Telemetry pipeline implemented to track User/AI Deltas with a PII-scrubbing middleware hook.

### Quality Gates
- [ ] **Test Coverage (>80%)**: Intent-based tests written using MSW to verify fallback chains, 429 exponential backoff, BullMQ job enqueuing, and legacy synchronous endpoint backward compatibility.
- [ ] Transactional safety (`runTransaction`) confirmed for Champion promotion.
- [ ] BullMQ workers demonstrate successful parallel processing without V8 thread starvation.