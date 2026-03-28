## Context

NicheAI aims to be the premier AI-assisted product ideation and validation platform. For early-stage founders, trusting an AI to dictate product strategy (like "build Feature X because Competitor Y failed at it") requires an exceptionally high bar for transparency.

The previous iteration relied on static prompts and opaque LLM calls, creating a "black box" that could confidently hallucinate features. To scale to an enterprise-grade intelligence platform, we must shift to **Auditable AI**. This means implementing strict **Data Provenance**: every AI-generated claim must be mathematically traceable back to a verbatim quote or bounding box in a raw asset (URL, PDF, or Image), and presented in a "Magical Onboarding" flow that feels like handing off work to a human Chief Product Officer.

## Goals / Non-Goals

**Goals:**

- Implement "Magical Onboarding": A single-input "Spark" that transitions into an immersive drag-and-drop asset ingestion zone.
- Establish strict Data Provenance: Extract exact string matches or geometric highlights from raw assets and display them in a split-screen "X-Ray" Provenance Inspector.
- Prevent Feature Bloat: Use a Tinder-style Card Swipe interface for MVP feature approval, tracking "MVP Weight" to enforce a 30-day build constraint.
- Asynchronous Processing: Move heavy Exa scraping and Vision ML tasks to durable background queues (BullMQ/Redis), streaming progress via SSE.

**Non-Goals:**

- Real-time collaborative multi-player editing of the Product Review Canvas in this sprint.
- Training our own custom foundational Vision models (we will rely on Gemini 1.5 Pro Vision or similar APIs for Phase 1).

## Decisions

**1. Asynchronous Job Architecture (BullMQ + SSE)**

- **Decision**: Break the monolithic sync job into specialized queues (URL, PDF, Image) using BullMQ backed by Redis. Use Server-Sent Events (SSE) to stream progress from the background workers to the frontend UI.
- **Rationale**: LLM vision processing and deep web scraping take minutes. Blocking HTTP requests causes timeouts and ruins the UX. SSE is lightweight, unidirectional (Backend -> Frontend), and has native auto-reconnect logic, perfect for the "AI Thinking" progress stream.
- **Alternatives Considered**:
  - _WebSockets_: Rejected as overly complex since we only need unidirectional progress updates, not bidirectional real-time chat.
  - _Polling_: Rejected as it introduces unnecessary latency and server load.

**2. Verbatim RAG Extraction (Anti-Hallucination)**

- **Decision**: Prompt the LLM strictly as an extractor (span-prediction) requiring Structured JSON output with an `exact_quote` and metadata (page, token offset). Implement a deterministic backend script (e.g., Python `in`) to verify the quote exists in the raw asset.
- **Rationale**: Generative models naturally hallucinate plausible-sounding quotes. Treating this as a classification task and forcing a deterministic backend check guarantees 100% auditability for the Provenance Inspector.
- **Alternatives Considered**:
  - _Blind Trust Summarization_: Rejected as it leads to "inferred features" that the user cannot verify, breaking trust in the platform.

**3. Soft Deletes for Assets**

- **Decision**: Implement `deleted_at` timestamps on the `assets` table instead of hard `CASCADE DELETE`.
- **Rationale**: If a user deletes an uploaded pitch deck, hard-deleting the asset would cascade and destroy the `feature_citations` junction table, thereby deleting the evidence for features currently active in their Living Strategy Dashboard. Historical integrity must be preserved.
- **Alternatives Considered**:
  - _Orphaned Citations_: Leaving citations pointing to null asset IDs breaks the UI for the Provenance Inspector.

## Risks / Trade-offs

- **Risk: Redis Payload Bloat (OOM Crashes)** -> Passing raw 40-page PDFs or Base64 images directly into the BullMQ job payload will crash Redis.
- **Mitigation**: Jobs must only pass the `asset_id` integer/UUID. The background worker will fetch the heavy file directly from the database or S3 bucket upon execution.
- **Risk: Browser Connection Limits for SSE** -> Browsers limit HTTP/1.1 connections to 6 per domain. Multiple tabs could exhaust this and stall the progress stream.
- **Mitigation**: Ensure the load balancer/proxy (Cloudflare/Vercel/Nginx) is explicitly configured for HTTP/2 multiplexing, allowing unlimited SSE streams over a single TCP connection.
