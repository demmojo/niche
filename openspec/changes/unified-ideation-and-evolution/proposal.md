## Why

Early-stage founders face two major traps: **Analysis Paralysis** (over-researching without acting) and **Feature Bloat** (building horizontal "tarpit" products that lack a specific niche).

Currently, our unimplemented specs (`ideation-workflow` and `product-evolution-engine`) overlap significantly, creating fragmented onboarding paths. Furthermore, an inconsistency exists between `raw-data-image-storage` and `deduplication-algorithm` where image uploads waste storage before deduplication.

We need a unified, streamlined flow that asks the user a simple branching question upfront, seamlessly ingests competitor data with optimistic UI loading, and forces the user to curate a "Hybrid Product" through a Tinder-style approval interface that strictly limits feature bloat via MVP budgeting guardrails.

## What Changes

A complete overhaul of the initial onboarding and product ideation experience, evolving it into the "Unified Ideation & Evolution Engine." We are replacing the static dashboard with a proactive flow containing Intent-Based Routing, asynchronous competitor ingestion, and a binary-swipe Hybrid Product Builder. We are also implementing a "Find a Niche" visual elimination tool and correcting the image deduplication logic to run client-side before cloud storage upload.

## Capabilities

### New Capabilities

- `intent-based-routing`: A massive, split-screen intent router at zero-state ("I have a specific idea" vs "I want to brainstorm a new idea").
- `optimistic-dag-ingestion`: A live Directed Acyclic Graph (DAG) powered by Server-Sent Events (SSE) showing the AI's internal reasoning steps while BullMQ handles heavy scraping/vision ML tasks in the background.
- `hybrid-product-builder`: A Tinder-style binary swipe interface for approving or rejecting AI-synthesized competitor features one at a time, incorporating `framer-motion` spring physics.
- `blue-ocean-discovery`: A "Find a Niche" button that pauses competitor extraction, highlights market white space via visual elimination, and injects highly differentiated gap features.
- `anti-bloat-guardrails`: A sticky MVP Budgeting progress bar (e.g., 30 days) with "color-coded friction" that warns and gamifies trade-offs when the user exceeds scope limits.
- `client-side-deduplication`: Computation of a 64-bit Difference Hash (dHash) using Web Workers/OffscreenCanvas in the browser to deduplicate images via Hamming Distance before hitting Supabase Storage.

### Modified Capabilities

- `ml-verbatim-rag`: Upgraded to a strict 3-tier validation waterfall (Strict -> Normalized -> Fuzzy) to prevent hallucinated exact quotes.
- `data-ingestion-queues`: Rearchitected using CQRS and BullMQ with Full Jitter exponential backoff and Redis-backed Circuit Breakers for 3rd-party API resilience.

## Impact

This impacts the entire zero-state and onboarding frontend architecture (`App.tsx`, `MyProduct.tsx`, `SummaryPage.tsx`). It introduces significant new UI mechanics (swiping, DAG visualization). On the backend, it fundamentally restructures job queuing (introducing specialized `network-io-queue` and `vision-ml-queue` via BullMQ) and requires adjustments to the Supabase image upload logic for pre-upload dHash verification.
