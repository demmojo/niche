## 1. Database & Schema Foundation (Provenance Tracking)

- [ ] 1.1 Create/Update `assets` table with `type` (url, pdf, image), `status`, `deleted_at` (Soft Delete), and `user_id`.
- [ ] 1.2 Create/Update `extracted_features` table with `name`, `description`, and `estimated_effort`.
- [ ] 1.3 Create `feature_citations` Many-to-Many junction table with `feature_id`, `asset_id`, `exact_quote`, `bounding_box_json`, `start_index`, and `end_index`.
- [ ] 1.4 Configure compound indexes on `(feature_id, asset_id)` for fast traversal.

## 2. Backend Background Workers & Queue Infrastructure

- [ ] 2.1 Implement durable BullMQ queues backed by Redis (specialized for URL scraping, PDF extraction, Image/Vision).
- [ ] 2.2 Configure workers to only accept `asset_id` in job payloads (preventing OOM errors) and fetch heavy files from DB/S3 within the worker.
- [ ] 2.3 Implement Redis Pub/Sub event broadcasting within workers to emit granular progress updates ("Scraping...", "Extracting Features...").
- [ ] 2.4 Create a Server-Sent Events (SSE) endpoint on the web server that subscribes to Redis Pub/Sub and streams progress to the client. Ensure HTTP/2 multiplexing is configured.

## 3. ML Pipeline & Verbatim RAG Extraction

- [ ] 3.1 Update LLM extraction prompts to enforce Verbatim Extractive Constraints (span-prediction) and Structured JSON output containing a `citations` array.
- [ ] 3.2 Implement a deterministic backend Python script (or equivalent) to verify that `exact_quote` strings exist within the raw asset text. Flag failed checks as "Inferred Features."
- [ ] 3.3 Implement metadata-enriched chunking logic for PDFs to capture structural metadata (page numbers, paragraph IDs, token offsets) for geometric mapping.
- [ ] 3.4 Add an escape hatch to the LLM prompt: "If no exact quote exists, output `[NOT_FOUND]`."

## 4. Magical Onboarding & "Feed the Brain" UI

- [ ] 4.1 Implement "The Spark" single-input field component with optimistic form submission.
- [ ] 4.2 Build the immersive drag-and-drop "Feed the Brain" zone component capable of parsing URLs, PDFs, and Screenshots.
- [ ] 4.3 Integrate the SSE connection to render the dynamic DAG (Directed Acyclic Graph) "AI Thinking" flowchart, highlighting active reasoning steps.
- [ ] 4.4 Add a "Pivot" button to the "AI Thinking" UI to interrupt processing and inject mid-thought constraints.

## 5. Hybrid Product Builder & Provenance Inspector UI

- [ ] 5.1 Implement the interactive "Extracted Product Definition" review canvas.
- [ ] 5.2 Build the "X-Ray" Provenance Inspector dual-pane side-panel, displaying the extracted feature on the left and the geometrically highlighted original asset (PDF/Image/URL text span) on the right.
- [ ] 5.3 Implement the Tinder-style Card Swipe UX for approving/rejecting proposed features (Name, Gap Addressed, Estimated Effort).
- [ ] 5.4 Build the sticky "MVP Weight" progress bar that visually tracks approved effort and triggers anti-bloat warnings.

## 6. Living Strategy Dashboard & Feedback Flywheel

- [ ] 6.1 Evolve the static "My Product" page into a Living Strategy Dashboard displaying calculated TAM/SAM/SOM, a Market Sentiment radar, and a feature-to-competitor-gap mapping table.
- [ ] 6.2 Capture diffs when users "Approve", "Reject", or edit AI-generated features on the canvas.
- [ ] 6.3 Log approved features as positive ground truth and rejected features as negative examples to seed the dynamic few-shot retrieval dataset.
- [ ] 6.4 Update `docs/plans/` and documentation to reflect the new auditable AI UX paradigms and SSE background queue architecture.
