## Why

Early-stage founders often fall into the trap of analysis paralysis or building horizontal "tarpit" ideas with bloated MVPs. Traditional market research is slow, manual, and disconnected from the product building cycle.

Furthermore, AI-generated strategy tools often feel like opaque "black boxes," leaving founders unsure if the recommended features or market gaps are based on real data or AI hallucinations. NicheAI needs to transition from a static dashboard into a trusted, proactive "Chief Product Officer" that guides the user from a single spark of an idea to a mathematically validated, lean MVP—all while providing absolute transparency and data provenance.

## What Changes

We are introducing the **Product Ideation & Niche Discovery Workflow**, a radical overhaul of the onboarding and product definition experience.

It replaces manual form-filling with a "Magical Onboarding" flow that ingests a single idea or URL, fires optimistic background jobs (scraping, OCR, Exa search), and allows the user to drag-and-drop assets (PDFs, screenshots, competitor URLs) to "Feed the Brain."

Crucially, it introduces **Strict Data Provenance**: every AI-generated feature or insight is linked directly back to its raw source (via an "X-Ray" Provenance Inspector). The final output is an interactive "Hybrid Product Builder" that uses Tinder-style cards to enforce MVP constraints and prevent feature bloat.

## Capabilities

### New Capabilities

- `magical-onboarding`: A single-input "Spark" screen and an immersive drag-and-drop zone for pitch decks, URLs, and screenshots.
- `ai-thinking-ui`: A dynamic Directed Acyclic Graph (DAG) flowchart powered by Server-Sent Events (SSE) showing the AI's internal reasoning steps in real-time.
- `provenance-inspector`: A split-screen "X-Ray" side panel that displays the exact geometric highlight or verbatim quote from the original asset that inspired an AI feature.
- `hybrid-product-builder`: A Tinder-style card interface for rapidly approving/rejecting AI-proposed features while tracking total "MVP Weight."
- `living-strategy-dashboard`: The evolved "My Product" page featuring TAM/SAM/SOM metrics, market sentiment radars, and feature-to-gap mapping.

### Modified Capabilities

- `external-signals-sync`: Broken down into specialized durable background queues (URL, PDF, Vision) utilizing BullMQ/Redis instead of blocking HTTP requests.
- `ml-insights`: Prompts updated to Verbatim RAG constraints requiring Structured JSON outputs with exact string-match citations and deterministic backend validation.

## Impact

This change fundamentally alters the core NicheAI workflow. It introduces new UI paradigms (SSE flows, drag-and-drop ingestion, dual-pane inspectors), restructures the backend processing into asynchronous durable queues (BullMQ), and requires significant schema changes (adding `assets`, `extracted_features`, and `feature_citations` with spatial metadata) to the Supabase/PostgreSQL database to guarantee historical integrity and data provenance.
