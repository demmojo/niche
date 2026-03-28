# Product Ideation & Niche Discovery Workflow

A radical redesign of the product onboarding flow to transition from static form-filling into an active, intelligent, and fully auditable Product Strategy Engine.

Founders provide a single URL or idea ("The Spark") and drag-and-drop assets into an immersive "Feed the Brain" zone. The AI performs heavy background scraping and vision extraction, streaming its reasoning steps via an "AI Thinking" Directed Acyclic Graph (DAG) UI. Finally, the user curates their MVP by swiping Tinder-style feature cards, with strict anti-bloat constraints enforcing a fast time-to-market. Every AI-proposed feature is backed by strict Data Provenance (exact citations to the uploaded PDFs, URLs, or screenshots), viewable in an "X-Ray" side-panel.

## Features

### 1. The "Magical Onboarding" (Value-First Setup)

- **Requirement:** A frictionless, single-input field ("What are you building or researching?") that fires optimistic background jobs immediately upon submission.
- **Requirement:** An immersive "Feed the Brain" drag-and-drop zone that handles pitch decks (PDF), competitor URLs, screenshots (PNG/JPEG), and feature lists seamlessly.
- **Requirement:** Parse assets via specialized background queues (URL, PDF, Image) and normalize data into `RawAssetChunk` formats in the database.

### 2. The "AI Thinking" UI (Building Trust)

- **Requirement:** A dynamic DAG flowchart powered by Server-Sent Events (SSE) that displays real-time progress (e.g., `[Search] Discovering competitors` -> `[Vision] Extracting pricing matrix`).
- **Requirement:** Surface intermediate insights (e.g., "Found 14 negative G2 reviews... analyzing for feature gaps") to prove the AI is working and build trust.
- **Requirement:** Allow users to "Steer" the AI: Provide a "Pivot" button to interrupt a process if it's heading toward a generic "Tarpit" idea and inject constraints mid-thought.

### 3. Strict Data Provenance (The "Trust Engine")

- **Requirement:** Implement a robust relational database schema (`assets`, `extracted_features`, `feature_citations` Many-to-Many junction table with spatial metadata like `bounding_box_json` and `start_index`).
- **Requirement:** Use Verbatim RAG constraints: Prompt the LLM strictly as an extractor requiring Structured JSON output containing an `exact_quote` array and `metadata` (page, token offset).
- **Requirement:** Implement a deterministic backend script (e.g., Python `in` operator) to verify the returned quote exists in the raw asset's text. Flag failed checks as "Inferred Features."
- **Requirement:** An "X-Ray" Provenance Inspector side-panel: Clicking a feature citation badge (e.g., `[2]`) opens a split-screen view showing the extracted feature alongside the original asset with the exact text span or bounding box highlighted.

### 4. Hybrid Product Builder & Anti-Bloat Guardrails

- **Requirement:** The AI synthesizes competitor features and gaps into a proposed "Hybrid Product."
- **Requirement:** Tinder-style Card Swipe UX: Present one feature at a time (Name, Strategic Value/Gap Addressed, Estimated Effort [High/Med/Low]).
- **Requirement:** Explicitly require the user to click "Approve" or "Reject."
- **Requirement:** Track the total "MVP Weight" in a sticky progress bar. If the scope exceeds a healthy 30-day build constraint, flash warnings to force non-critical features to the "Post-Launch Roadmap."

### 5. Living Strategy Dashboard

- **Requirement:** The "My Product" page evolves from a static form into an enriched dashboard featuring calculated TAM/SAM/SOM metrics, a qualitative Market Sentiment radar, and a direct feature-to-competitor-gap mapping table.

## Scenarios

- **WHEN** a user enters a competitor URL in the "Spark" input
- **THEN** the system immediately transitions to the "Feed the Brain" dropzone, renders the "AI Thinking" DAG, and fires a BullMQ job to scrape the URL, streaming progress back via SSE.

- **WHEN** the background ML worker extracts a feature (e.g., "Automated Invoice Parsing") from an uploaded pitch deck
- **THEN** the LLM must return the exact string-match quote ("We need to parse invoices automatically") and page number metadata in the Structured JSON response, which the backend deterministically verifies before saving to `feature_citations`.

- **WHEN** a user views the Hybrid Product Builder and clicks a citation badge on an AI-proposed feature
- **THEN** the "Provenance Inspector" side-panel slides out, displaying a dual-pane "X-Ray" view with the original pitch deck PDF on the right, highlighting the exact quote geometrically.

- **WHEN** a user approves multiple "High Effort" feature cards in the Hybrid Product Builder
- **THEN** the sticky "MVP Weight" progress bar turns red and displays a warning: "Your MVP is getting bloated. To validate this niche and get paid quickly, move some features to the Post-Launch Roadmap."

- **WHEN** a user deletes an uploaded asset from the Living Strategy Dashboard
- **THEN** the system applies a `deleted_at` timestamp (Soft Delete) to the `assets` table, ensuring the historical `feature_citations` link remains intact so the feature's provenance is not lost.
