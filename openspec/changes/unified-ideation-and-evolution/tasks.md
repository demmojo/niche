## 1. Phase 1: Infrastructure & Backend Foundations

- [x] 1.1 Implement BullMQ queues (`network-io-queue` and `vision-ml-queue`) with Redis.
- [x] 1.2 Configure BullMQ with custom Full Jitter exponential backoff and Redis-backed Circuit Breakers for Exa API resilience.
- [x] 1.3 Create the Server-Sent Events (SSE) streaming API endpoint backed by Redis Streams (`XADD`/`XREAD`) for connection resilience.
- [x] 1.4 Implement the backend heartbeat comment (`:\n\n`) mechanism for SSE to prevent load balancer connection drops.
- [x] 1.5 Build the 3-tier validation waterfall (Strict -> Normalized -> Fuzzy) in the backend to enforce Verbatim RAG Extraction.

## 2. Phase 2: Client-Side Processing & Deduplication

- [x] 2.1 Develop the Web Worker logic for client-side image processing.
- [x] 2.2 Implement the 64-bit Difference Hash (dHash) algorithm using `OffscreenCanvas` inside the Web Worker.
- [x] 2.3 Create the backend API endpoint to calculate Hamming Distance and return either an existing Supabase URL or a presigned upload URL.
- [x] 2.4 Update the frontend upload flow to utilize the pre-upload dHash verification.

## 3. Phase 3: Zero-State & Onboarding UI

- [x] 3.1 Design and build the split-screen Intent-Based Router ("I have a specific idea" vs "I want to brainstorm a new idea").
- [x] 3.2 Create the URL Paste Area with a hard-limit of 5 competitors and custom microcopy for limit enforcement.
- [x] 3.3 Implement the "AI Thinking DAG" UI component that subscribes to the SSE endpoint and visualizes the BullMQ job progress in real-time.

## 4. Phase 4: Hybrid Product Builder & Swipe Mechanics

- [x] 4.1 Build the Tinder-style binary swipe interface using `framer-motion` for spring physics.
- [x] 4.2 Design the feature cards to include the "X-Ray" provenance badge (e.g., "Found in Competitor A's pricing page") while keeping text under 15 words.
- [x] 4.3 Add visible "Thumbs Up / Thumbs Down" buttons for accessibility.

## 5. Phase 5: MVP Budgeting & Blue Ocean Discovery

- [x] 5.1 Implement the sticky MVP Budgeting progress bar (30-day limit) with "color-coded friction" (green/yellow/red).
- [x] 5.2 Create the gamified advisor (Archivist Burt) popup that triggers when the MVP scope limit is exceeded.
- [x] 5.3 Build the "Find a Niche" button and its integration to pause standard extraction.
- [x] 5.4 Develop the logic to generate and visually highlight (gold/purple) the 5-10 "Gap Features" with Market Size and Confidence Score metrics.
