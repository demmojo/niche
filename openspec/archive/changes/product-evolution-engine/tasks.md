## 1. Backend & Data Model Updates

- [ ] 1.1 Update `MyProductData` schema in Supabase to include new fields for feature provenance (linking to raw data/G2 reviews), webhook sync statuses (`planned`, `in-development`, `shipped`), and AI write-access permissions.
- [ ] 1.2 Create backend API endpoints for the CLI telemetry webhook to receive and process `- [x]` task completion updates from local `tasks.md` files.
- [ ] 1.3 Implement the Tarpit Analyzer scoring logic on the backend, integrating with AI models to evaluate product definitions against tracked competitors and general AI capabilities.
- [ ] 1.4 Develop the visual intelligence processing pipeline to parse uploaded screenshots (pricing pages, dashboards). Use a 2-step pipeline with a local/fast detection model (like OmniParser) for bounding boxes and a multimodal LLM for abstract feature extraction.
- [ ] 1.5 Implement the Zero-Knowledge BYOK (Bring Your Own Key) proxy gateway for multimodal requests. Ensure it accepts OpenAI/Anthropic/Google keys, downscales images (max 1080p) to optimize token costs, and enforces daily spending caps.
- [ ] 1.7 Implement a backend integration module for the Cloudflare API to provision Web Analytics `site_tokens` (`POST /client/v4/accounts/{account_id}/rum/site_info`) and query the Cloudflare GraphQL Analytics API (`POST /client/v4/graphql`) for `rumPageloadEventsAdaptiveGroups`. Cache responses (e.g., Redis TTL) to prevent rate limits.
- [ ] 1.8 Create the backend infrastructure to manage the OAuth or API token (BYOK) connection to a user's Cloudflare account to execute OpenNext deployments to Cloudflare Pages edge.

## 2. Frontend Core & AI Integration

- [ ] 2.1 Update the Product Definition flow (`MyProduct.tsx`) to integrate the Tarpit Analyzer.
- [ ] 2.2 Build the "Tarpit Warning" modal and the iterative constraint UI loop, ensuring it explains reasoning with sources and allows endless AI suggestions or custom inputs.
- [ ] 2.3 Grant Archivist Burt (`MarketAnalysis` chat) write access to the `MyProductData` state and implement the UI for users to "Approve" proposed features directly in chat.
- [ ] 2.4 Build the "Suggestion Feed" dashboard widget to display silently analyzed features.
- [ ] 2.5 Implement the "Provenance Popovers" for the Suggestion Feed, linking features back to their source data (e.g., G2 reviews, competitor matrix).
- [ ] 2.6 Enable explicit feature extraction by allowing users to highlight cells in the Competitor Matrix and click "Extract to Product."
- [ ] 2.7 Build the "Smart Upload Zone" modal with a fast OCR/metadata pass to prompt for competitor context or "My Product" toggle before heavy processing.
- [ ] 2.8 Create the "Extraction X-Ray" wireframe loading animation for visual processing.
- [ ] 2.9 Implement the "Actionable Overlay" UI for competitor analysis ("The Lens"). Present an interactive split-screen (image on left, data cards on right) with faint bounding boxes that illuminate on hover. Include bulk triage controls (Select All, multi-select).
- [ ] 2.10 Add shadcn/ui tooltips to the Actionable Overlay data cards to display the "Competitive Importance Rank" (1-100) and the AI's methodology/reasoning.
- [ ] 2.11 Develop the "Reality Check" split-screen diff UI for own-product analysis ("The Mirror"), highlighting missing features and proposing state updates against `MyProductData`.

## 3. Documentation Wizard & Tooling

- [ ] 3.1 Upgrade the Documentation Wizard to include the new "Validation Spec" (smoke test) option.
- [ ] 3.2 Implement the generation of best-in-class React/Next.js frontend code (leveraging shadcn/ui and Magic UI/Aceternity UI) optimized for Cloudflare Pages (via OpenNext) within the Validation Spec output.
- [ ] 3.3 Create the "Seamless Deployment Wizard" frontend UI. Build Step 1: Cloudflare OAuth connection modal (with inline validation and deep-link fallback).
- [ ] 3.4 Develop Step 2 of the Deployment Wizard: A vertical "Deployment Checklist" skeleton loader replacing raw terminal output. Show states like [✓] Securing domain → [✓] Provisioning Analytics → [⚙] Building Application → [ ] Deploying to Global Edge.
- [ ] 3.5 Develop Step 3 of the Deployment Wizard: A celebration empty state (confetti) guiding the user to the "Fake Door Metrics" dashboard. Display a "Listening for your first visitor..." radar/pulse animation with a "Visit your live site" CTA.
- [ ] 3.6 Build the "Fake Door Metrics" dashboard UI. Fetch data via NicheAI's cached Cloudflare GraphQL backend to display page views, referrers, unique visitors, and calculate the "Visitor-to-Lead" conversion metric (baseline 2-5%, good 5-10%).
- [ ] 3.7 Develop the CLI telemetry webhook tool (Node.js script) that users can run locally to sync their `tasks.md` progress with the NicheAI cloud dashboard.
- [ ] 3.8 Add a manual "Mark Complete" UI button in the NicheAI dashboard as a fallback for the telemetry bridge.
- [ ] 3.9 Build the "Capability Gap" dashboard to compare live, synced features against competitor offerings.
