# Product Evolution Engine

A reimagined core workflow within NicheAI specifically designed to help small, AI-empowered teams rapidly identify, validate, and evolve hyper-niche micro-SaaS products.

## Features

### 1. The "Niche Defensibility" Score (Tarpit Analyzer)

- **Requirement:** Automatically score user product definitions in `MyProduct.tsx` against tracked competitors and AI capabilities to detect if it's a "Tarpit" (a highly horizontal, commoditized idea). Intervene with an educational "Tarpit Warning" that explains exactly why the idea is a Tarpit using impeccable reasoning and cites real-world sources/market data.
- **Requirement:** Provide an iterative constraint loop presenting suggested, highly specific, underserved niches. Allow users to generate more AI suggestions endlessly or write their own custom pivot/constraint for re-analysis, guiding them through evidence rather than arbitrarily locking them out.

### 2. Market-Driven Feature Injection (The Suggestion Feed)

- **Requirement:** Create a "Suggestion Feed" UI widget that silently analyzes incoming data (e.g., uploaded data, competitor matrix insights, background AI syncs) and surfaces matter-of-fact actionable features (e.g., "Competitor X dropped their mobile app. Add to roadmap?").
- **Requirement:** Allow users to explicitly highlight any cell in the Competitor Matrix and click "Extract to Product."
- **Requirement:** Every suggested feature must link directly back to its source using a "Provenance Popover" (e.g., "Source: 14 negative G2 reviews for Competitor X").

### 3. Validation Before Infrastructure (Fake Door Planning & Seamless Deployment Wizard)

- **Requirement:** Expand the Documentation Wizard to offer a "Validation Spec" (smoke test) before generating a full technical OpenSpec.
- **Requirement:** This spec will output the exact copy, landing page structure, and programmatic SEO tags needed to test the niche's distribution viability. NicheAI will generate both Markdown specs and best-in-class React/Next.js frontend code (leveraging shadcn/ui and Magic UI/Aceternity UI) optimized for Cloudflare Pages (via OpenNext).
- **Requirement:** Implement a Seamless Deployment Wizard UI. The wizard guides the user through:
  - **Step 1:** OAuth or Deep Link API token connection to their Cloudflare account (inline validation).
  - **Step 2:** Auto-provisioning Cloudflare Web Analytics via the RUM Site Info API and injecting the `site_token` as a `NEXT_PUBLIC` env variable during the build.
  - **Step 3:** Deploying the Next.js app to Cloudflare Pages edge.
  - **Step 4:** A Celebration "Go to Dashboard" empty state (e.g., radar animation "Listening for your first visitor...").
- **Requirement:** Develop a native "Fake Door Metrics" dashboard within NicheAI. Use the Cloudflare GraphQL Analytics API to fetch `rumPageloadEventsAdaptiveGroups` (page views, unique visitors, referrers) and calculate the crucial **Visitor-to-Lead** conversion intent metric (baseline target 2-5%, good 5-10%). Display this seamlessly to the user.

### 4. Organic Evolution via Chat (The Proactive PM)

- **Requirement:** Grant the existing `MarketAnalysis` AI chat (Archivist Burt) write access to the `MyProductData` state.
- **Requirement:** Allow the AI to propose features directly in chat while discussing market shifts. When the user clicks "Approve," the feature is instantly tracked and ready for PRD export.

### 5. Visual Intelligence Sync Engine (The Mirror & The Lens)

- **Requirement:** Implement a "Smart Upload Zone" UX that runs a fast OCR/metadata pass when an image is uploaded. Ask the user to confirm context ("Is this Competitor X?") or select "This is My Product" before starting heavy LLM processing.
- **Requirement:** Build an "Actionable Overlay" UI for analyzing competitor screenshots ("The Lens"). Use a 2-step ML pipeline (e.g., OmniParser + Claude 3.5 Sonnet / Gemini 1.5 Pro Vision) to draw bounding boxes and map UI elements to a defined feature taxonomy. Present the image alongside extracted data cards (features, insights).
- **Requirement:** Incorporate an AI ranking methodology in the "Actionable Overlay." Each data card should have a "Competitive Importance Score" (1-100) and a hover tooltip explaining the LLM's visual reasoning for that rank. Enable users to bulk-select (Select All, multi-select) features to add to the roadmap.
- **Requirement:** Build a "Reality Check" split-screen diff UI when users upload screenshots of their own product ("The Mirror"). Compare extracted visual features against current `MyProductData` state in Supabase, highlighting missing features and proposing state updates (e.g., "Move 'Dark Mode' to 'Shipped'?").
- **Requirement:** Develop a Zero-Knowledge API Proxy Gateway for the Visual Intelligence Sync Engine. It must securely accept user API keys (BYOK), dynamically downscale images to optimize token costs (max 1080p), and manage rate limits before passing requests to Anthropic/OpenAI/Google.

### 6. Feature Lifecycle Syncing (The Telemetry Bridge)

- **Requirement:** Support both a manual UI button and a robust, automated CLI webhook tool to sync local development progress back to the cloud dashboard.
- **Requirement:** When an AI coding agent completes tasks in a local `tasks.md` file, the CLI tool automatically reports this back. NicheAI uses this to maintain a real-time "Version History" and surface a "Capability Gap" dashboard comparing your live features against competitors.

## Scenarios

- **WHEN** a user defines a new product as a "generic AI email client"
- **THEN** NicheAI displays a "Tarpit Warning", explains why it's highly horizontal and commoditized using market data, and offers specific underserved niches (e.g., "AI email client exclusively for real estate closing attorneys"), allowing the user to iterate on the constraint.

- **WHEN** a user uploads a CSV of scraped G2 reviews containing negative feedback about a competitor's reporting
- **THEN** the "Suggestion Feed" surfaces a feature "Build a custom PDF reporting engine" with a "Provenance Popover" linking back to the specific 14 negative G2 reviews.

- **WHEN** a user selects "Validation Spec" in the Documentation Wizard
- **THEN** NicheAI generates a `.zip` archive containing Markdown specs and a ready-to-deploy React/Next.js landing page built with shadcn/ui and Magic UI components.

- **WHEN** a user proceeds to the "Seamless Deployment Wizard" after generating a Validation Spec
- **THEN** NicheAI guides them through a 1-click OAuth connection to their Cloudflare account. It auto-provisions Cloudflare Web Analytics via the `/rum/site_info` API, injects the `site_token` to the Next.js `layout.tsx`, and deploys the app to the Cloudflare Pages edge.

- **WHEN** a user opens the "Fake Door Metrics" dashboard
- **THEN** NicheAI queries the Cloudflare GraphQL Analytics API (`rumPageloadEventsAdaptiveGroups`) to display page views, referrers, and calculate the "Visitor-to-Lead" conversion rate natively, replacing the empty state radar animation once the first ping is received.

- **WHEN** a user uploads a screenshot but doesn't provide a name
- **THEN** the "Smart Upload Zone" runs a fast OCR/metadata pass and presents a beautiful modal asking "Is this [Guessed Competitor Name]?" with a quick-select "This is My Product" toggle.

- **WHEN** a user uploads a competitor screenshot ("The Lens") and confirms the context
- **THEN** an "Extraction X-Ray" wireframe animation plays during processing. The system then displays an "Actionable Overlay" split-screen UI showing the image on the left and extracted data cards on the right. Hovering over a card illuminates a bounding box on the original screenshot, and hovering over the "Competitive Importance Score" reveals a tooltip with the AI's reasoning.

- **WHEN** a user uploads their own product's screenshot ("The Mirror") and confirms the context
- **THEN** the AI compares visual features against `MyProductData` state in Supabase, presenting a "Reality Check" split-screen diff UI that proposes state updates (e.g., "Would you like to move 'Dark Mode' to 'Shipped' based on this screenshot?").

- **WHEN** a user clicks "Approve" on a feature proposed by Archivist Burt in chat
- **THEN** the feature is instantly added to the `MyProductData` state and appears in the roadmap.

- **WHEN** an AI coding agent locally checks off a `- [x]` task in the exported `tasks.md` file
- **THEN** the CLI webhook tool automatically pings the NicheAI backend, updating the feature status on the cloud dashboard and reflecting the change in the "Capability Gap" analysis.
