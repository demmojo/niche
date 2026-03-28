## 1. Backend & Data Pipeline

- [ ] 1.1 Scaffold Supabase `pgvector` extension and define the schema for `FeatureEmbeddings`, `MarketScope`, and `MergeAuditLogs`.
- [ ] 1.2 Implement the Node.js background worker (using a message queue or cron) to generate embeddings for newly ingested market data using OpenAI `text-embedding-3-small` (or Gemini equivalent). Implement rate-limiting or batching to ensure these queries do not monopolize the Supabase CPU.
- [ ] 1.3 Implement the cosine similarity clustering algorithm to identify and group duplicate features/sub-features within a specific market scope. The worker MUST maintain an `audit_logs` record containing the prior state before executing a deduplication merge to enable soft-delete rollbacks.
- [ ] 1.4 Create API endpoints for the BFF layer to serve clustered/deduplicated data to the frontend Analytics grids.
- [ ] 1.5 Implement the "Send to Lens" API handler to package and transmit the current analytics context (filters, data slice) to the Lens AI service.
- [ ] 1.6 Implement a Superadmin API and basic UI to review the automated deduplication audit log and trigger a "rollback" for false positive merges.

## 2. Frontend Foundation & UI Shell

- [ ] 2.1 Set up the new `NextGenAnalytics` container component, integrating it into the main App routing.
- [ ] 2.2 Implement the "Command Center" aesthetic (brutalist/premium typography, high-contrast dark mode) using Tailwind CSS v4, aligning with the Lens Strategy Console design system.
- [ ] 2.3 Integrate a modern charting library (e.g., Recharts, Tremor, or Nivo) that supports high-fidelity SVG rendering and custom styling.
- [ ] 2.4 Implement the foundational `TanStack Table` wrapper for the smart custom tables, enabling virtualization (`@tanstack/react-virtual`) for large datasets.

## 3. Reporting Canvas & Triple-Mode UI

- [ ] 3.1 Build the "Pre-built Templates" mode: Develop fixed React components for standard competitive layouts (e.g., Pricing Matrix, Feature Gap).
- [ ] 3.2 Build the "Freeform Drag & Drop" mode: Integrate a drag-and-drop grid system (e.g., `react-grid-layout`) to allow arbitrary placement of charts, text, and tables.
- [ ] 3.3 Build the "Smart Dynamic Layout" mode: Implement an AI service call that analyzes selected data dimensions and returns a JSON layout configuration to auto-populate the Freeform grid. Implement a strict schema validation layer (e.g., Zod) to parse, sanitize, and fallback the AI-generated JSON before rendering.
- [ ] 3.4 Implement the "Smart Filtering" logic for data tables: When adding columns, query the backend to only show semantically compatible attributes based on the current data slice. Implement aggressive caching (React Query) and debouncing to prevent UI latency.

## 4. Export & Onboarding

- [ ] 4.1 Implement high-fidelity PDF export. Evaluate a server-side headless browser generation endpoint (e.g., Puppeteer) via the BFF for true fidelity. If client-side via `jspdf` is strictly required, ensure the export is a single continuous page to prevent slicing SVG charts across page breaks.
- [ ] 4.2 Implement Image (PNG) export for individual charts and the full canvas using `html2canvas` or similar.
- [ ] 4.3 Implement Spreadsheet (CSV/XLSX) export for the underlying data of the custom tables.
- [ ] 4.4 Integrate an interactive "spotlight" onboarding wizard (e.g., using `intro.js` or `react-joyride`) to guide users through the Triple-Mode reporting features. Make it permanently dismissible via a user preference flag in Firestore.

## 5. Integration & Chat-to-Chart

- [ ] 5.1 Implement the "Send to Lens" button on the Analytics dashboard and wire it to open the Lens Strategy Console with the pre-loaded context.
- [ ] 5.2 Build the "Chat-to-Chart" contextual sidebar component, scoping its AI context strictly to the currently viewed table or chart's semantic definition and data.
- [ ] 5.3 Implement dynamic re-slicing: Allow the AI in the Chat-to-Chart sidebar to suggest and apply new filters or grouping parameters to the active table based on user queries.
