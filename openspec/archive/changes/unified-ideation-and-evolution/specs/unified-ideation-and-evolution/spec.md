# Unified Ideation & Evolution Engine

A comprehensive overhaul of the NicheAI onboarding and product ideation experience, evolving it into a proactive, opinionated "Chief Product Officer" that guides users from a blank slate to a lean, validated, and data-backed MVP using asynchronous processing, a binary-swipe Hybrid Product Builder, and a "Find a Niche" visual elimination tool.

## Features

### 1. Intent-Based Routing

- **Requirement:** A split-screen intent router at zero-state ("I have a specific idea" vs "I want to brainstorm a new idea") using progressive disclosure.
- **Requirement:** Limit the initial flow to under 5-7 core steps to optimize Time-to-Value (TTV).
- **Requirement:** Hide irrelevant features entirely rather than graying them out.

### 2. Asynchronous Competitor Ingestion & Optimistic DAG

- **Requirement:** A URL Paste Area allowing users to paste up to 5 competitor URLs, with strict UI limits enforced.
- **Requirement:** Asynchronous scraping and ML extraction via BullMQ and Redis (employing `network-io-queue` and `vision-ml-queue`).
- **Requirement:** A live Directed Acyclic Graph (DAG) powered by Server-Sent Events (SSE) showing the AI's internal reasoning steps in real-time.
- **Requirement:** SSE connection resilience using Redis Streams (`XADD`/`XREAD`) and heartbeat comments (`:\n\n`) every 15 seconds.

### 3. The "Hybrid Product" Builder (Tinder-Style UX)

- **Requirement:** A Tinder-style binary swipe interface (using `framer-motion` spring physics) for approving or rejecting AI-synthesized competitor features one at a time.
- **Requirement:** Keep card text under 15 words to maintain swipe flow and reduce cognitive load.
- **Requirement:** Every card features an "X-Ray" provenance badge proving _why_ the AI suggested it (e.g., "Found in Competitor A's pricing page").

### 4. Blue Ocean Discovery

- **Requirement:** A prominent "Find a Niche" button within the swipe stack that pauses standard extraction.
- **Requirement:** Generates 5-10 highly differentiated "Gap Features" (things competitors explicitly ignore).
- **Requirement:** Gap Features are highlighted uniquely (e.g., gold/purple) and include Market Size and Confidence Score metrics.

### 5. Anti-Bloat Guardrails (MVP Budgeting)

- **Requirement:** A sticky progress bar tracking the "MVP Weight" or estimated development effort (e.g., a 30-day limit) of approved features.
- **Requirement:** "Color-coded friction" (green/yellow/red) that warns the user when their MVP is getting bloated.
- **Requirement:** An advisor character (Archivist Burt) pops up when the bar exceeds the limit to gamify the trade-off.

### 6. Client-Side Image Deduplication

- **Requirement:** Compute a 64-bit Difference Hash (dHash) using Web Workers/OffscreenCanvas in the browser to deduplicate images before uploading to Supabase Storage.
- **Requirement:** The backend calculates the Hamming Distance. If distance `<= 4` (visually identical), return the existing Supabase URL. Otherwise, return a presigned URL for a net-new upload.

### 7. Verbatim RAG Extraction Pipeline

- **Requirement:** A strict 3-tier validation waterfall (Strict -> Normalized -> Fuzzy) to prevent hallucinated exact quotes from the LLM.

## Scenarios

- **WHEN** the user lands on the zero-state page.
- **THEN** they are presented with a massive, split-screen intent router ("I have a specific idea" vs "I want to brainstorm a new idea").

- **WHEN** the user adds 5 competitor URLs to the URL Paste Area.
- **THEN** the system prevents adding a 6th and displays microcopy: _"Analyzing more than 5 competitors leads to feature parity traps. Let's focus on your top 3 threats."_

- **WHEN** the background scraping and ML extraction jobs are active.
- **THEN** the UI displays a live Directed Acyclic Graph (DAG) updating via Server-Sent Events (SSE) to show the AI's "thought process".

- **WHEN** the user interacts with the Hybrid Product Builder.
- **THEN** they are presented with a Tinder-style swipe interface, evaluating one AI-synthesized feature card at a time.

- **WHEN** the user clicks the "Find a Niche" button.
- **THEN** the system generates 5-10 highly differentiated "Gap Features" highlighted uniquely, including Market Size and Confidence Score metrics.

- **WHEN** the user approves too many heavy features, causing the MVP Budgeting progress bar to exceed the 30-day limit.
- **THEN** the progress bar turns red and an advisor pops up warning of MVP bloat, forcing a gamified trade-off before generating Validation Specs.

- **WHEN** the user attempts to upload an image.
- **THEN** the client computes a 64-bit Difference Hash (dHash) using a Web Worker to verify deduplication against the backend before hitting Supabase Storage.
