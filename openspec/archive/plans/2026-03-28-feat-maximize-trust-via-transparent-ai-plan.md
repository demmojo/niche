---
title: Maximize Trust in Proprietary SaaS via Calibrated Transparent AI
type: feat
status: active
date: 2026-03-28
---

# Maximize Trust in Proprietary SaaS via Calibrated Transparent AI

## Overview

As NicheAI solidifies its position as a proprietary, closed-source SaaS, we must proactively build trust with founders who are inputting their most highly-guarded intellectual property (their startup ideas). Since we cannot rely on open-source transparency, we will implement "Calibrated Trust"—proving reliability through cryptographic verification, strict data provenance, and explainable UX patterns, even when the underlying model weights and source code remain hidden.

This plan details the implementation of 5 core Trust Patterns across our Express/React/Zustand architecture: Zero Data Retention (ZDR) Receipts, Granular RAG Provenance, Explainable Rationale, Counterfactual Sliders, and the Autonomy Dial.

## Problem Statement / Motivation

Founders use NicheAI for critical competitive intelligence and market validation. A "black box" AI that simply says "Trust us, we don't train on your data" is insufficient in 2026. Users need cryptographic proof of data safety, clear citations for AI-generated claims (to combat hallucination fears), and visibility into _why_ an AI made a specific strategic recommendation. Without these, churn will increase as users hesitate to upload their core IP or trust the strategic outputs.

## Proposed Solution

Implement a suite of "Transparent AI" features:

1.  **Cryptographically Verifiable Zero Data Retention (ZDR):** Provide mathematical proof that sensitive prompts are processed ephemerally and instantly destroyed.
2.  **Granular RAG Provenance & "Source Anchoring":** Force LLMs to cite specific, interactive sources (Exa, Apollo) for every claim.
3.  **"Explainable Rationale" via Top-Driver Attribution:** Visualize the decision boundaries and criteria behind AI scores (e.g., Niche Viability Score).
4.  **Counterfactuals & "What-If" Playbooks:** Allow users to interactively test the boundaries of the AI's logic (e.g., "What if I changed my target audience?").
5.  **The "Autonomy Dial" and Action Audits:** Give users granular control over Agentic AI autonomy (Co-Pilot vs. Auto-Pilot) with pre-execution consent logs.

## Technical Approach

### Architecture

The implementation spans the full stack:

- **Backend (Express BFF / `llmRoutes.ts`):** Enforce ZDR headers on all LLM API calls. Generate SHA-256 "Ephemerality Receipts" for sensitive prompts. Enhance the RAG pipeline (`EmbeddingService`) to pass strict metadata (URLs, timestamps) into the context window and mandate inline citations (`<cite id="..." />`).
- **Backend (Task Queues / `queues.ts`):** Modify background jobs to support a `PENDING_CONSENT` state, pausing execution until frontend approval is received for agentic actions.
- **Frontend (React / Zustand):** Create a new `useActionAuditStore` to track AI states and proposed actions. Implement custom markdown renderers for interactive `<cite>` tooltips. Build the "Autonomy Dial" and "Score Breakdown Drawer" UI components.

### Implementation Phases

#### Phase 1: Zero Data Retention (ZDR) & Ephemerality Receipts

- **Tasks:**
  - Update `llmRoutes.ts` to strictly enforce ZDR flags/headers for all supported providers (Gemini, Anthropic, OpenAI). Throw 403 Forbidden if a provider/tier doesn't support it for `sensitive=true` requests.
  - Implement server-side generation of a one-way SHA-256 hash combining the raw prompt and a secure timestamp.
  - Return the "Ephemerality Receipt" alongside the LLM response.
  - Build the "ZDR Lock" UI indicator and Receipt Viewer component in the ideation/validation views.
- **Success Criteria:** Sensitive prompts are verifiably not retained by providers; users can view the cryptographic receipt.

#### Phase 2: Granular RAG Provenance & Source Anchoring

- **Tasks:**
  - Update RAG prompt templates to strictly require inline `<cite>` tags tied to specific metadata IDs injected from Exa/Apollo data.
  - Create a `CitationMap` in a new Zustand store to manage active sources for a given session.
  - Develop a custom React markdown plugin to parse `<cite>` tags and render interactive tooltips displaying the raw, unedited source text and timestamp.
- **Success Criteria:** AI claims regarding competitors or market data are consistently and accurately anchored to verifiable sources visible on hover.

#### Phase 3: Action Audit Log & Autonomy Dial

- **Tasks:**
  - Implement `useActionAuditStore` in Zustand with a circular buffer (e.g., max 50 entries) to prevent memory bloat.
  - Update background task queues (`queues.ts`) to support a `PENDING_CONSENT` state.
  - Build the "Autonomy Dial" (Co-Pilot vs. Auto-Pilot) UI.
  - Build the interactive Audit Log UI, allowing users to review gathered context and compiled prompts before approving batched execution.
- **Success Criteria:** Users can successfully pause, review, and approve complex AI agent workflows before they commit changes.

#### Phase 4: Explainable Rationale & Counterfactuals (UX Polish)

- **Tasks:**
  - Design and implement the "Score Breakdown Drawer" to visualize feature attribution for metrics like the Niche Viability Score.
  - Build "Counterfactual Sliders" in the ideation phase to allow users to dynamically test alternative inputs (e.g., changing target audience) and see predicted score changes.
- **Success Criteria:** The AI's strategic decisions are transparent and interactive, significantly reducing the "black box" feel.

## Technical Considerations

- **LLM Provider Limitations:** We must rigorously verify that the selected LLM tiers genuinely honor ZDR headers.
- **Context Window Exhaustion:** Passing granular metadata (URLs, raw snippets) increases token usage. We must implement an intermediate "Data Sanitization" step to summarize data before injecting it as a citation source.
- **Zustand Memory:** The `useActionAuditStore` must have a strict size limit to avoid browser degradation during long sessions.
- **UX Friction:** The Autonomy Dial must batch proposed actions to avoid overwhelming the user with consent requests in Co-Pilot mode.

## Acceptance Criteria

- [ ] `llmRoutes.ts` correctly applies ZDR headers and generates SHA-256 receipts for sensitive requests.
- [ ] The UI displays a "ZDR Lock" and allows users to view their Ephemerality Receipt.
- [ ] The RAG pipeline successfully injects citation IDs, and the LLM correctly outputs `<cite>` tags.
- [ ] Hovering over an AI claim displays a tooltip with the raw source text and timestamp.
- [ ] The Autonomy Dial allows users to switch between Co-Pilot (requires consent) and Auto-Pilot modes.
- [ ] The Action Audit Log correctly intercepts and displays pending backend tasks for user approval.
- [ ] The Score Breakdown Drawer clearly explains the drivers behind a given AI score.
- [ ] Counterfactual Sliders allow users to interactively test alternative inputs.

## References & Research

- Industry Standard: Vercel AI Gateway & xAI Enterprise ZDR implementation patterns.
- Fair Source/Source-Available Licensing implications (See internal discussions on proprietary vs FSL).
