# Proposal: Enterprise ML Orchestration and Prompt System

## Why

Currently, the NicheAI codebase lacks a unified, dynamic system for selecting LLMs. Hardcoding models creates brittleness, suboptimal performance, and wasted tokens. Furthermore, prompt engineering lacks standardization, and there is no feedback loop to mathematically prove that prompt changes actually improve output quality.

We need an enterprise-grade self-learning system that utilizes real-world telemetry (with PII scrubbing) to curate "Gold Standard" test sets, statistically validates every ML change before deployment, and safely orchestrates long-running tasks.

## What Changes

1. **Capability-Driven Smart Routing:** Semantic routing mapping tasks to model tiers (Lite, Fast, Pro) using Multi-Armed Bandits (MAB) for adaptive traffic distribution. Includes strict "Rate Limiting Safety (No Escalation)" to prevent fallback to expensive models on 429 exhaustion.
2. **Enterprise Asynchronous Orchestration:** Enforcement of the HTTP 202 Accepted pattern using Google Cloud Tasks and the Firestore Claim Check pattern for heavy payloads. Worker endpoints MUST hold the HTTP request open and require OIDC JWT (`requireInternalOidc`) to guarantee Cloud Run CPU allocation securely.
3. **Mathematically Validated Self-Learning System:** Implementation of a Champion-Challenger architecture where ML configurations must pass a Paired Student's t-test against a Gold Standard dataset.
4. **Immutable ML Versioning:** Utilizing Firestore Append-Only SCD Type 2 tracking for prompts, schemas, and routing rules.
5. **CO-STAR Standard:** Mandating the CO-STAR framework for all prompt generation and Zod schemas for structured outputs.

## Capabilities

- **Hardened Asynchronous Architecture:** Upgrades from fragile in-memory queues to serverless push-based Cloud Tasks tailored for scale-to-zero Cloud Run environments.
- **Advanced ML Versioning:** Robust data governance with bounded subscriptions to prevent OOM errors.
- **Gold Standard Validation Engine:** Tri-Modal scoring pipeline designed as a "Short-Circuit Waterfall" to save API costs.

## Impact

- **Product-Led Growth (PLG):** The "Reverse Demo Hook" applies a Product Qualified Lead (PQL) gate mapped to the Pro tier for deep analysis workflows.
- **Data Flywheel:** Tracks the "Delta" (diff) between the AI's generation and the user's manual edits. A telemetry pipeline scubs PII via regex heuristics before promoting high-quality data to the evaluation dataset.
- **Cost Protection:** Strict No Escalation guarantees prevent accidental spikes in LLM billing.
