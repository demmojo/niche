# Tasks: Brand Positioning Wizard

## Phase 1: Backend Infrastructure & Security

- [x] Define Firestore Security Rules to strictly isolate `BrandWizardJob` and `ProjectBrandIdentity` by `userId`.
- [x] Set up Express API endpoint for job ingestion (`POST /api/brand-wizard`).
- [x] Implement strict SSRF validation on incoming URLs (block private IPs, localhost, non-HTTP/HTTPS).
- [x] Implement IP-based and user-based rate limiting on the job creation endpoint.
- [x] Set up backend Global Queue (e.g., BullMQ or Cloud Tasks) to handle async processing.
- [x] Return `202 Accepted` with a generated `jobId` from the Express endpoint.

## Phase 2: ETL Pipeline & LLM Integration

- [x] Integrate Firecrawl SDK on the backend queue worker.
- [x] Implement graceful degradation: if Firecrawl returns 403, proceed with partial data or use Exa API fallback.
- [x] Integrate Gemini Flash API using Structured Outputs matching the `CompetitorBrand` schema.
- [x] Craft the prompt to enforce Chain of Thought (must output `_reasoning` field first).
- [x] Implement payload bloat mitigation: discard raw Firecrawl markdown immediately after Gemini extraction.
- [x] Parse and validate Gemini output using Zod before updating the Firestore `BrandWizardJob` document.

## Phase 3: Frontend Data Sync & Layout

- [x] Build the URL input form with client-side validation (max 5 URLs).
- [x] Create a custom hook `useBrandWizardJob` that listens to the `BrandWizardJob` via Firestore `onSnapshot`.
- [x] Build the loading UI reflecting `progress` state (total vs completed vs failed).
- [x] Build the "Blue Ocean Detected" fallback UI for zero-result scenarios.

## Phase 4: Dashboard & Visualization

- [x] Build the "Sea of Sameness" Competitor Mood Board (tight grid of logos, colors, typography).
- [x] Build the 2x2 Positioning Matrix using generative axes provided by the backend.
- [x] Implement "Transparent AI" hover states (popovers showing DOMPurify-sanitized `_reasoning`).
- [x] Implement CSS transforms/Framer Motion for dragging nodes (avoid React state layout thrashing).
- [x] Apply the 7±2 Rule: cluster massive color/typography sets into dominant groups.

## Phase 5: Guided Wizard & Concurrency Safeguards

- [x] Build the 3-step Guided Wizard (Vibe -> Colors -> Typography) with split-pane layout.
- [x] Build the "Magic Button" (Find the Whitespace) Auto-Generate feature.
- [x] Implement debounced inline warnings ("Contrarian Move" popovers) using `AbortController` to cancel stale requests and prevent split-brain UI.
- [x] Fix React 19 concurrency tearing: Wrap sequential state updates after async awaits in a secondary `startTransition`.
- [x] Build the final Market Fit validation screen and commit the synthesized `ProjectBrandIdentity` to Firestore.
