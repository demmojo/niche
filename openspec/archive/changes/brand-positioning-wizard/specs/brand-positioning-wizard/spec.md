# Spec: Brand Positioning Wizard

## Core Features

### 1. Ingestion & Loading Flow

Users input 3-5 competitor URLs. The system validates them securely and begins a background extraction process.

- **SCENARIO:** Validating URLs
  - **WHEN** the user submits URLs
  - **THEN** validate for SSRF, block localhost/private IPs, and initiate a `202 Accepted` request.
- **SCENARIO:** Real-time Progress
  - **WHEN** the backend processes the job
  - **THEN** the UI updates via Firestore `onSnapshot` showing progress (e.g., "Extracting color palettes...").
- **SCENARIO:** Zero-Data Edge Case
  - **WHEN** Firecrawl/Exa returns 0 results (highly obscure niche)
  - **THEN** trigger a celebratory "Blue Ocean Detected" UI state and fall back to broad industry defaults.

### 2. "Sea of Sameness" Dashboard

Visualizes the extracted competitor data to illustrate market saturation.

- **SCENARIO:** Generative Axes
  - **WHEN** extraction completes
  - **THEN** Gemini generates hyper-specific X/Y axes based on the competitor cluster.
- **SCENARIO:** Visual Weighting
  - **WHEN** rendering the mood board and matrix
  - **THEN** give high-confidence extractions solid borders and low-confidence extractions dashed/muted borders.

### 3. Transparent AI & Live Context

As the user navigates the wizard, the UI provides context and rationale for AI outputs.

- **SCENARIO:** Tooltip Reasoning
  - **WHEN** the user hovers over a competitor node in the matrix
  - **THEN** display a DOMPurify-sanitized popover showing the raw `_reasoning` text.
- **SCENARIO:** Contrarian Move Warning
  - **WHEN** the user selects a generic option (e.g., standard blue in a sea of blue tech companies)
  - **THEN** show a debounced "Contrarian Move" warning anchored to their selection.

### 4. Branching Paths (Magic vs Guided)

- **SCENARIO:** The Magic Button
  - **WHEN** the user clicks "Find the Whitespace"
  - **THEN** mathematically plot the empty quadrant on the 2x2 matrix and auto-generate the differentiated brand identity.
- **SCENARIO:** Guided Wizard
  - **WHEN** the user chooses manual configuration
  - **THEN** present a 3-step progressive flow (Vibe -> Colors -> Typography) with 80% pre-filled opinionated defaults.
