---
title: Unified Ideation & Evolution Engine
type: feat
status: active
date: 2026-03-27
---

# Unified Ideation & Evolution Engine

## Overview

A comprehensive overhaul of the NicheAI onboarding and product ideation experience. This feature merges and resolves inconsistencies between the `ideation-workflow` and `product-evolution-engine` proposals. It shifts the platform from a static form-based tool to a proactive, opinionated "Chief Product Officer" that guides users from a blank slate to a lean, validated, and data-backed MVP.

## Enhancement Summary

**Deepened on:** 2026-03-27
**Research agents used:** best-practices-researcher, architecture-strategist

### Key Improvements

1. **Refined Intent Routing:** Documented UX best practices for time-to-value (TTV) and split-screen zero-state UI.
2. **Swipe Interface Physics:** Specified `framer-motion` for spring physics and cognitive load reduction in the Hybrid Product Builder.
3. **Robust Asynchronous Architecture:** Detailed CQRS, BullMQ Full Jitter backoff, and SSE state resumption via Redis Streams to ensure the "AI Thinking DAG" never freezes.
4. **Verbatim RAG Waterfall:** Outlined a 3-tier validation strategy to handle LLM quote hallucinations (Strict -> Normalized -> Fuzzy).
5. **Edge Compute Deduplication:** Specified dHash via Web Workers/OffscreenCanvas for client-side image deduplication to prevent UI thread lockups.

## Problem Statement / Motivation

Early-stage founders face two major traps: **Analysis Paralysis** (over-researching without acting) and **Feature Bloat** (building horizontal "tarpit" products that lack a specific niche).

Currently, our unimplemented specs (`ideation-workflow` and `product-evolution-engine`) overlap significantly. One focuses on "Magical Onboarding" and a "Hybrid Product Builder", while the other focuses on a "Tarpit Analyzer" and "Visual Feature Extraction." Furthermore, there is an inconsistency between `raw-data-image-storage` and `deduplication-algorithm` where immediate image uploads bypass deduplication logic, wasting storage.

We need a unified, streamlined flow that asks the user a simple branching question upfront, seamlessly ingests competitor data, and forces the user to curate a "Hybrid Product" through a Tinder-style approval interface that strictly limits feature bloat.

## Proposed Solution

We will build a unified "Product Evolution Engine" flow containing the following phases:

### 1. Intent-Based Routing (The Branching Origin)

Ask the user a single, decisive question upon entry:

- **Option A: "I have a specific idea"** -> Routes to a "Value-First Setup" (Tarpit Analyzer) to constrain and define the core workflow.
- **Option B: "I want to brainstorm a new idea"** -> Prompts for basic sector/user-type info (e.g., B2B, B2C), OR allows skipping directly to adding competitor homepage URLs.

### Research Insights

**Best Practices:**

- Use a massive, split-screen intent router on first login with max 2-3 options. Hide irrelevant features entirely rather than graying them out.
- Optimize for Time-to-Value (TTV) by keeping the initial flow under 5-7 core steps.

**UX/UI Considerations:**

- **Anti-Pattern:** The "Tooltip Tour Barrage" or generic blank canvas.
- **Implementation Detail:** Progressive Disclosure. Do not show advanced tools (like the Sync Engine) until the core niche is validated.

### 2. Low-Friction Competitor Ingestion & Optimistic UI

- **URL Paste Area:** Users paste competitor URLs to "copy" them.
- **Constraint Enforcement:** Hard-limit the input to **3 to 5 competitors**. Display microcopy: _"Analyzing more than 5 competitors leads to feature parity traps. Let's focus on your top 3 threats."_
- **Optimistic Loading (AI Thinking DAG):** As soon as URLs are added, the backend begins asynchronous scraping and ML extraction (using BullMQ/Redis and SSE). The UI displays a live Directed Acyclic Graph (DAG) showing the AI's "thought process" (e.g., `Ingesting > Analyzing Gaps > Formulating Hybrid Product`) to build trust.

### 3. The "Hybrid Product" Builder (Tinder-Style UX)

- The AI synthesizes competitor features into distinct, atomic feature cards.
- **Card Swipe Interface:** Present one feature at a time. The user must explicitly **Approve** or **Reject** it.
- **Data Provenance:** Every card features an "X-Ray" provenance badge proving _why_ the AI suggested it (e.g., "Found in Competitor A's pricing page").

### Research Insights

**Best Practices:**

- The binary swipe gesture reduces cognitive load significantly (from ~12.4 to ~2.2 mental effort units compared to list-picking).
- Keep card text under 15 words to maintain swipe flow.

**UX/UI Considerations:**

- Implement realistic UI physics (e.g., via `framer-motion`). Cards should slightly rotate when dragged.
- Include visible "Thumbs Up / Thumbs Down" buttons for desktop/accessibility.
- Add a "Provenance Popover" badge on the card (e.g., "Requested in 14 G2 reviews of Competitor X").

### 4. Blue Ocean Discovery ("Find a Niche" Button)

- Inject a prominent **"Find a Niche"** button within the swipe stack.
- Clicking it pauses standard feature extraction and generates 5-10 highly differentiated "Gap Features" (things competitors explicitly ignore).
- These features are highlighted uniquely (e.g., gold/purple) and include **Market Size** and **Confidence Score** metrics to validate the blue ocean opportunity.

### Research Insights

**Best Practices:**

- Use Visual Elimination to highlight white space in the market, rather than dumping large matrices.
- Animate a glowing highlight on 1-2 underserved edge-cases when the button is clicked.

**UX/UI Considerations:**

- Include a "Capability Gap" Radar Chart to visually prove the opportunity.
- **Copywriting:** Use opinionated, matter-of-fact copy: _"3 major competitors over-index on Workflow Automation. Zero competitors offer HIPAA-compliant localized hosting. This is your wedge."_

### 5. Anti-Bloat Guardrails (MVP Budgeting)

- A sticky progress bar tracks the "MVP Weight" or estimated development effort of approved features.
- **Constraint:** If the user approves too many heavy features, the progress bar turns red. A warning appears: _"Your MVP is getting bloated. To validate this niche and get paid quickly, limit your scope to 30 days of effort. Move non-critical features to your Post-Launch Roadmap."_

### Research Insights

**Best Practices:**

- MVP budgeting is shifting to a **Time-to-Resolve Uncertainty** (30-to-90 day framework).
- Gamified constraints (like YNAB) turn rules into engaging challenges.

**UX/UI Considerations:**

- Use "Color-coded friction" (green/yellow/red). Avoid hard-blocking users, as it causes churn.
- Implement an advisor character (Archivist Burt) to pop up when the bar exceeds the limit: _"Tarpit Warning: Your MVP scope just exceeded 30 days. To stay defensible, which of these 3 'Nice-to-Have' features should we cut?"_
- Force a gamified trade-off before generating Validation Specs.

## Technical Considerations

### 1. Asynchronous Processing & Job Queues (CQRS & BullMQ)

- **Architecture:** Separate read/write models. The frontend commands an analysis session, which dispatches a BullMQ Flow (Parent-Child DAG).
- **Queue Isolation:** Route IO-bound jobs (scraping) to a `network-io-queue` and compute-bound jobs (Vision tasks) to a GPU-optimized `vision-ml-queue` to prevent blocking.
- **Resilience:** Implement custom exponential backoff with **Full Jitter** to prevent thundering herd problems with 3rd-party APIs (like Exa). Use Redis-backed Circuit Breakers to pause queues if providers go down.

### 2. Live UI Streaming (Server-Sent Events)

- **DAG State Mapping:** A dedicated API listener intercepts BullMQ global events (`active`, `progress`, `completed`) and maps them to UI node IDs, pushing JSON payloads over SSE.
- **Connection Stability:** Load balancers drop idle connections. The backend must emit heartbeat comments (`:\n\n`) every 15 seconds.
- **State Resumption:** Browsers limit HTTP/1.1 connections (use HTTP/2). When SSE drops, the client reconnects with `Last-Event-ID`. The backend must replay missed events from a capped Redis Stream (`XREAD`) to prevent the UI from freezing.

### 3. Verbatim RAG Extraction Pipeline

- **Prompting:** Use LLM Structured Outputs (strict JSON) to force the schema: `{ "feature_name": string, "exact_quote": string }`.
- **Deterministic Validation Waterfall:** LLMs often hallucinate whitespace or smart quotes. Validate via a 3-tier waterfall:
  1. **Strict Match:** `quote in source_text`
  2. **Normalized Match:** Strip whitespace/lowercase/Unicode NFKC.
  3. **Fuzzy Fallback:** Sliding window Levenshtein distance (>95% similarity).
- **Self-Correction:** If all fail, trigger a fast LLM retry prompt: _"Validation failed. Your quote was not found verbatim. Re-extract."_

### 4. Client-Side Image Deduplication (Edge Compute)

- **Algorithm:** Cryptographic hashes (SHA-256) are useless for images. Use **Difference Hashing (dHash)**.
- **Implementation:** Process the `File` blob in a Web Worker using `OffscreenCanvas` (resized to 9x8 grayscale) to prevent main-thread UI jank. Compute the 64-bit dHash (16-char hex).
- **Backend Resolution:** Send the hash to the backend. The database calculates the Hamming Distance. If distance `<= 4` (visually identical), return the existing Supabase URL. Otherwise, return a presigned URL for a net-new upload.

## Acceptance Criteria

- [ ] Users can choose between "I have an idea" and "Brainstorm".
- [ ] Users can paste up to 5 competitor URLs, with strict UI limits enforced.
- [ ] The "AI Thinking" DAG UI accurately reflects background BullMQ job progress via SSE.
- [ ] The "Hybrid Product Builder" renders features as swipable/approvable cards.
- [ ] The "MVP Weight" progress bar turns red and blocks further additions if the scope exceeds the defined limit.
- [ ] The "Find a Niche" button generates visually distinct gap features with market size estimates.
- [ ] Images/data are hashed client-side and deduplicated before uploading to Supabase Storage.

## References & Research

- Best Practices Research: Intent-Based Routing, Tinder-style binary decision UX, Verbatim RAG Extraction for Auditable AI.
- Related OpenSpec proposals: `ideation-workflow`, `product-evolution-engine`, `deduplication-algorithm`, `raw-data-image-storage`.
