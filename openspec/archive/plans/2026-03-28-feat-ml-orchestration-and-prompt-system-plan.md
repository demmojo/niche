---
title: "feat: ML Orchestration, Model Routing, and Prompt Engineering System"
type: feat
status: active
date: 2026-03-28
---

# ML Orchestration, Model Routing, and Prompt Engineering System

## Overview

This document outlines the architectural implementation of NicheAI's internal Machine Learning systems. It codifies the rules for model selection, capability-driven routing, and prompt engineering best practices based on Leeropedia standards. It replaces static model selection with a dynamic, cost-efficient, and highly accurate orchestration layer.

## Problem Statement / Motivation

Currently, the NicheAI codebase lacks a unified, dynamic system for selecting LLMs based on the specific task. Hardcoding models (like the deprecated `gemini-3-flash-preview`) leads to API failures, suboptimal performance, and wasted tokens. Furthermore, prompt engineering needs to be standardized across the codebase using the CO-STAR framework to ensure high-fidelity, parseable outputs without prompt injection vulnerabilities.

## Proposed Solution

1. **Capability-Driven Smart Routing:** Introduce a semantic routing layer (`Capability`) that routes tasks to the most appropriate model tier (Lite, Fast, Pro) based on complexity, latency constraints, and cost.
2. **CO-STAR Prompt Standardization:** Enforce the CO-STAR (Context, Objective, Style, Tone, Audience, Response) framework for all prompt generation (e.g., in `promptAssembler.ts`).
3. **Structured Outputs & AST Sanitization:** Mandate native Zod JSON schemas for extraction tasks and AST-based sanitization for markdown fallbacks.
4. **Asynchronous ML Orchestration:** Enforce the HTTP 202 Accepted pattern with bounded concurrency for heavy ML tasks to protect the main V8 thread.

## Technical Approach

### Architecture

#### 1. The Model Tiering System (Smart Routing)

Models are categorized into three tiers based on capability:

- **Lite Tier (`gemini-3.1-flash-lite-preview`)**
  - **Purpose:** High-volume data extraction, structured JSON parsing, translation, and basic classification.
  - **Routing Trigger:** `capability: 'extraction'` or `complexity: 'low'`
  - **Characteristics:** Lowest latency, lowest cost, prone to logic errors on complex reasoning.
- **Fast Tier (`gemini-3.1-flash`)**
  - **Purpose:** Standard chatbot interactions, balanced speed/reasoning, and zero-shot categorization.
  - **Routing Trigger:** `capability: 'chat'` or `complexity: 'medium'`
  - **Characteristics:** Excellent balance of speed and intelligence. The default workhorse.
- **Pro Tier (`gemini-3.1-pro-preview`)**
  - **Purpose:** Complex problem-solving, multi-step agentic reasoning, LLM-as-a-Judge evaluations, and deep market synthesis.
  - **Routing Trigger:** `capability: 'reasoning'` or `complexity: 'high'`
  - **Characteristics:** High latency, higher cost, maximum intelligence.

#### 2. Prompt Engineering Standards (Leeropedia Best Practices)

All system prompts must be assembled using the **CO-STAR Framework**:

```typescript
// Example of compliant prompt assembly structure
export interface COSTARPrompt {
  context: string; // [CONTEXT] Background and domain
  objective: string; // [OBJECTIVE] The main goal
  style: string; // [STYLE] Rhetorical approach (e.g., analytical)
  tone: string; // [TONE] Attitude/mood (e.g., formal)
  audience: string; // [AUDIENCE] Intended recipient
  response: string; // [RESPONSE] Expected format (e.g., JSON schema)
}
```

- **Explicit Constraints:** Use XML-like tags (e.g., `<design_system_constraints>`) for critical rules to prevent attention drift.
- **Native Structured Outputs:** For data extraction, prompts must use `zodToJsonSchema` to enforce shape natively via the Gemini API, avoiding regex parsing entirely.

#### 3. Execution & Orchestration

- **Concurrency Control:** Use `p-queue` (max 5-10 concurrent) for Lite Tier extraction bursts to prevent TCP socket exhaustion.
- **Zero Data Loss:** Use the `workerId` leasing and heartbeat pattern defined in `.cursor/rules/ml-engineering-standards.mdc` for background jobs.
- **Failover Logic:** Implement exponential backoff + jitter for HTTP 429 Rate Limits _before_ escalating to a more expensive tier.

### Implementation Phases

#### Phase 1: Core Routing Infrastructure

- Define the `Capability` types and model arrays in `src/utils/aiClient.ts`.
- Implement `withModelFallback` to support capability-based routing.

#### Phase 2: Prompt Assembler Refactor

- Refactor `src/utils/promptAssembler.ts` to explicitly type and require all CO-STAR elements.
- Migrate existing prompts to the new structure.

#### Phase 3: Validation & Telemetry

- Update `usageTracker.ts` to parse actual token metrics dynamically from API responses.
- Implement AST-based sanitization (`DOMPurify` / `rehype-sanitize`) for markdown fallbacks.

## PLG & Cognitive Load Strategy

- **Reverse Demo Hook:** Users do not need to configure models manually. The system defaults to "Auto (Smart Routing)" to reduce cognitive load, silently optimizing cost/latency behind the scenes.
- **Explainable States:** During Pro Tier execution (high latency), the UI must display staggered loading steps (e.g., "Analyzing market data...", "Synthesizing competitor gaps...") to maintain user trust and reduce perceived wait time.
- **Progressive Profiling:** When a power user wants to override a model, expose the settings progressively (Basic Auto -> Advanced Override).

## Acceptance Criteria

### Functional Requirements

- [ ] `aiClient.ts` routes requests based on the `Capability` enum rather than a hardcoded model string.
- [ ] `gemini-3.1-pro-preview`, `gemini-3.1-flash`, and `gemini-3.1-flash-lite-preview` are established as the core models.
- [ ] All prompts generated by `promptAssembler.ts` adhere to the CO-STAR structure.

### Quality Gates

- [ ] Intent-based tests written using MSW to verify fallback chains and 429 exponential backoff.
- [ ] Zod schemas used exclusively for structured outputs (no regex scraping).

## References & Research

- **Internal Rules:** `.cursor/rules/ml-engineering-standards.mdc`
- **Past Brainstorms:** `openspec/brainstorms/2026-03-26-smart-llm-routing-brainstorm.md`
- **Prompt Framework:** CO-STAR (Context, Objective, Style, Tone, Audience, Response)
- **ML Best Practices:** Leeropedia guidelines on Model Selection, Safe Execution (V8 thread safety), and Schema Drift Fallbacks.
