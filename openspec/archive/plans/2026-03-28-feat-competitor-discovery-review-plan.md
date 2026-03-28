---
title: Competitor Discovery Review Flow
type: feat
status: active
date: 2026-03-28
---

# Competitor Discovery Review Flow

## Overview

Improve the user journey for the "Run Deep Validation Campaign" by introducing a Human-in-the-Loop (HITL) Competitor Curation step. Currently, the system automatically discovers competitors in the background during the deep validation process, denying the user the ability to review, prune, or understand the competitive landscape before committing to a deep analysis. This feature intercepts that flow, discovers competitors first, presents them with an explainable competition score, and allows the user to curate the list before running the deep analysis.

## Problem Statement / Motivation

Founders often struggle to define their exact competitors, leading to either empty competitor lists or bloated, irrelevant ones. When the system automatically assigns competitors without review, it risks running a deep, expensive analysis on the wrong targets. By adding a curation step, we empower founders to understand _why_ certain tools are considered competitors (via explainable AI rationale) and train the system on their specific niche intent by explicitly keeping or discarding suggestions. This aligns with NicheAI's core product vision of guiding founders out of the tarpit.

## Proposed Solution

1. **New Discovery API Endpoint**: Create `POST /api/campaign/discover-competitors` to run the Exa search and a fast Gemini Flash pass to evaluate competition level.
   - _Heuristic optimization_: Modify Exa search to use the "Ideal Page" Semantic Heuristic. Query `site:reddit.com` or `site:g2.com` combined with unmet "Jobs to Be Done" or post-mortems to find deeply relevant, niche competitors rather than just high-level SEO domains.
2. **Hybrid Scoring Methodology**: Implement a 3-factor LLM evaluation (Job-to-be-Done, Audience, Mechanism) using lightweight models (Gemini Flash-Lite or heuristic approximations) to calculate a percentage overlap and categorize competitors into 3 tiers: Direct, Adjacent, and Legacy.
3. **Curation UI**: Introduce a `CompetitorDiscoveryModal` in the frontend that triggers when a user attempts to run a campaign without competitors.
4. **Data Flywheel**: Capture the user's explicit Keep/Discard decisions to feed back into future intent matching.
5. **Campaign Handoff**: Once curated, proceed to the existing `/api/campaign/start` flow with the refined competitor list.

## PLG & Cognitive Load Strategy

### The Reverse Demo Hook

Instead of forcing users to meticulously enter 5 competitors manually (a high-friction form), we provide a "Reverse Demo." When they click "Run Deep Validation Campaign," they are immediately shown high-quality, pre-populated competitor cards (the output) based on their basic product idea. This demonstrates the AI's value instantly and shifts their task from "data entry" to "curation."

### Cognitive Load & Progressive Profiling

The flow operates on a strict 3-tier progressive profiling framework to protect cognitive load:

1. **Tier 1 (Core Identity):** User provides only their `Product Name` and `Brief Description` (handled previously).
2. **Tier 2 (The Curation Modal):** User is presented with 3-5 discovered competitors. The UI relies purely on simple binary actions (Keep/Discard toggle). No complex forms or nested settings.
3. **Tier 3 (Deep Analysis):** Only after the user confirms the list does the deep validation commence, utilizing the newly verified baseline.

### Designing for Uncertainty

Since the Exa search + Flash scoring involves network latency and LLM variance:

- **Explainable States:** The UI must feature staggered, specific loading states: _"Querying Exa for G2/Reddit mentions..."_ -> _"Analyzing Job-to-be-Done overlap..."_ -> _"Scoring competition tiers..."_ This maintains trust during high-latency AI operations.
- **Graceful Degradation:** If the LLM extraction fails, gracefully fall back to just showing the domain names returned by Exa without a similarity score, allowing the user to still curate the list manually.

## Technical Approach

### Architecture

- **Backend Route:** A new Express route `/api/campaign/discover-competitors`. It will use `exa-js` to fetch 5-10 domains based on `baseIdea`.
- **Scoring Engine:** A prompt wrapped with `withModelFallback` utilizing Gemini Flash. It strictly returns a JSON array (via `zodToJsonSchema`) matching: `{ name, domain, description, similarityScore, matchTier, matchRationale }`.
- **Frontend State:** A `discoveryQueue` state in `App.tsx` or `ValidationArena.tsx` to hold the uncommitted competitors until the user accepts them.

### Edge Cases Handled

- **Empty Exa Results:** If Exa returns 0 results (unlikely but possible), the UI should gracefully fall back to asking the user to manually enter a competitor or refine their product description.
- **LLM Rate Limits:** Since discovery happens synchronously before the campaign, `withModelFallback` is critical to prevent the UI from hanging.
- **Existing Competitors:** If the user already added 1 or 2 competitors manually, the "Run Deep Validation Campaign" button should _still_ offer to find more, or just proceed with the manual ones. We should ask the user if they want to discover more, or automatically discover the remainder up to 5.

## Acceptance Criteria

### Functional Requirements

- [ ] A new `POST /api/campaign/discover-competitors` endpoint is implemented and validated via Zod.
- [ ] The endpoint returns a list of competitors with `name`, `domain`, `description`, `similarityScore` (0-100), `matchTier` (Direct, Adjacent, Legacy), and `matchRationale`.
- [ ] The frontend `DeepValidationButton` intercepts clicks if the `competitors` list is empty, triggering the discovery flow via a loading state ("Scanning for competitors...").
- [ ] A `CompetitorDiscoveryModal` displays the discovered competitors using the 3-tier visual system (🔴 Direct, 🟡 Adjacent, 🔵 Legacy) and explainable rationale.
- [ ] Users can toggle (Keep/Discard) competitors in the modal.
- [ ] Clicking "Confirm & Run Analysis" in the modal passes the selected competitors to the existing `handleGlobalSync` flow.
- [ ] The existing automated Exa fallback in the BullMQ worker is removed or bypassed if competitors are explicitly provided.

### Quality Gates

- [ ] High-test coverage for the `discover-competitors` endpoint.
- [ ] The modal UI adheres to the "UI/UX Excellence" rules (clean whitespace, clear typography, and intent-based design).

## Success Metrics

- 100% of deep validation campaigns are run with user-curated competitor lists.
- Reduction in "garbage in, garbage out" campaign results.

## Dependencies & Risks

- **API Latency**: Combining Exa search and LLM scoring synchronously could lead to UI timeouts if not optimized. We must use loading states in the frontend.
- **Model Fallback**: The scoring mechanism must use the existing `withModelFallback` utility to ensure reliability.

## References & Research

- Current Exa fallback implementation: `src/server/campaignRoutes.ts` line 297.
- Current deep validation trigger: `src/App.tsx` line 1815 (`handleGlobalSync`).
- Best Practices Research: Human-in-the-Loop curation, 3-tier threat bucketing, and explainable AI rationale.
