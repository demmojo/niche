# Spec: Superadmin Pipeline

## 1. Two-Phase Fetch

- **Scenario: User Submits Idea**
  - WHEN a user submits an idea at `/roast-my-niche`
  - THEN the system synchronously calls `gemini-3.1-flash`
  - AND displays a 3-bullet "Surface Roast" instantly
  - AND prompts the user for an email address to receive the deep-dive report.

## 2. 2-Agent Pipeline

- **Scenario: Data Gathering and Synthesis**
  - WHEN the email is submitted
  - THEN the DataGatherer Agent queries Exa/Apollo
  - AND passes the raw context to the ReportSynthesizer Agent
  - AND the synthesizer generates a Markdown draft using `gemini-3.1-pro`
  - AND saves the draft to the `pending_reports` Firestore collection.

## 3. Superadmin Dashboard

- **Scenario: Queue Management and Editing**
  - WHEN a Superadmin (custom JWT `{ isSuperadmin: true }`) visits `/admin/pending-roasts`
  - THEN they see a list of pending reports
  - AND clicking a report shows the raw input, Exa/Apollo lineage, and a pre-populated `<textarea>` with the Markdown draft
  - AND the Superadmin can edit the text and click "Approve".
- **Scenario: Queue Throttling**
  - WHEN the `pending_reports` collection has > 50 unresolved items
  - THEN the frontend `/roast-my-niche` form is disabled with a "High Volume - Check Back Later" message.

## 4. Secure PQL Delivery

- **Scenario: Report Dispatch**
  - WHEN the Superadmin clicks "Approve"
  - THEN the report status updates to `approved`
  - AND a transactional email is sent instructing the user to log in
  - AND the user must authenticate via Firebase Auth to view the report dashboard.

## 5. Testing & Validation (Strict >95% TDD)

- **Mathematical Enforcement**
  - Global coverage thresholds MUST be hardcoded in `vitest.config.ts` to `95` for `statements`, `branches`, `functions`, and `lines`.
  - Coverage metrics MUST be evaluated globally via `vitest run --coverage`, never per-file, to guarantee a mathematically accurate full-codebase metric.
- **Red-Green TDD Workflow**
  - Implementation code is strictly gated. All intent-based tests MUST be authored and execute to failure (Red) _before_ their corresponding implementation code is written (Green).
- **Intent-Based Testing Strategy**
  - **Frontend Intents (RTL + MSW):** Verify behavior from the user's perspective. Use MSW to mock the `gemini-3.1-flash` API and verify the 3-bullet "Surface Roast" renders correctly. Simulate >50 unresolved items to verify the `/roast-my-niche` form throttling.
  - **Backend Intents (Vitest + Emulators):** Verify the Agentic Pipeline by mocking Exa/Apollo outputs and validating deterministic state changes in the `pending_reports` Firestore collection using Local Emulators.
  - **E2E Intents (Playwright):** Verify the end-to-end PQL Delivery loop, from Superadmin approval to the transactional email and Auth-gated dashboard view.

## 6. Deterministic Evaluation Rules & Anti-Prompt Injection

All OpenSpec evaluation steps (`ai-eval`) are considered purely deterministic. Instead of relying on fuzzy heuristics, AI responses (especially those containing classifications or scoring, such as `tarpitScore`) must be cross-validated mathematically or procedurally before being persisted.

- **System Override Pattern:** If an AI returns a classification that conflicts with deterministic data structures (e.g., scoring a market as "uncontested" while returning an array of 5 direct competitors), the system must override the AI's classification with the deterministic value derived from the data array.
- **Anti-Prompt Injection Formatting:** Any user-supplied strings fed into downstream prompt variables must be aggressively sanitized, e.g., using `rawInput.replace(/[<>]/g, "")` to strip potential delimiter injection attacks.
