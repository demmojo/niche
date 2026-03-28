# Specification: Calibrated Transparent AI

## Features & Scenarios

### 1. Zero Data Retention (ZDR) Receipts

**Feature:** Verifiable proof of prompt ephemerality.

- **Scenario: Processing highly sensitive startup IP**
  - **GIVEN** a user marks an input as sensitive or is in the core ideation view
  - **WHEN** the Express BFF (`llmRoutes.ts`) processes the request
  - **THEN** it must enforce provider-specific ZDR headers
  - **AND** return a SHA-256 hash receipt combining the prompt and timestamp
  - **AND** throw a `403 Forbidden` if the chosen LLM tier fails to support ZDR.

### 2. Granular RAG Provenance

**Feature:** Interactive citations for AI claims.

- **Scenario: Rendering competitor analysis**
  - **GIVEN** the LLM generates a market claim utilizing Exa/Apollo context
  - **WHEN** the response is rendered in the UI
  - **THEN** it must include `<cite id="...">` tags
  - **AND** hovering over the tag must render a custom Markdown tooltip displaying the raw source text and timestamp from the `CitationMap`.

### 3. Action Audit Log & Autonomy Dial

**Feature:** Granular consent over AI actions.

- **Scenario: Agentic tasks in Co-Pilot Mode**
  - **GIVEN** the Autonomy Dial is set to "Co-Pilot"
  - **WHEN** a background worker attempts to execute an action (e.g., web scraping or data mutation)
  - **THEN** the queue sets the job to `PENDING_CONSENT`
  - **AND** an entry is pushed to the `useActionAuditStore` for user approval.

### 4. Explainable Rationale & Counterfactuals

**Feature:** Visualizing AI decision boundaries.

- **Scenario: Reviewing the Niche Viability Score**
  - **GIVEN** an AI-generated score is displayed
  - **WHEN** the user opens the "Score Breakdown Drawer"
  - **THEN** they see top-driver attribution metrics
  - **AND** can manipulate Counterfactual Sliders (e.g., target audience size) to see predicted score changes in real-time.
