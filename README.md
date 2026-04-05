<div align="center">
  <img width="1200" height="475" alt="NicheAI Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
  <h1>NicheAI</h1>
  <p>An advanced, AI-driven Competitive Intelligence & Market Analysis tool</p>

  <p>
    <a href="https://github.com/your-org/nicheai/actions"><img src="https://img.shields.io/github/actions/workflow/status/your-org/nicheai/ci.yml?branch=main" alt="CI Status" /></a>
  </p>
</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Tech Stack](#-tech-stack)
- [Architecture & Boundaries](#-architecture--boundaries)
- [Design Philosophy](#-design-philosophy)
- [Security & Data](#-security--data)
- [Product Roadmap & OpenSpecs](#️-product-roadmap--openspecs)
- [Recent Momentum](#-recent-momentum)
- [Sprint Insights & Tech Debt](#-sprint-insights--tech-debt)
- [Local Development Setup (Quick Start)](#-local-development-setup-quick-start)
- [Available Scripts](#-available-scripts)
- [AI Agent Benchmarking (SWE-Bench)](#-ai-agent-benchmarking-swe-bench)
- [Testing](#-testing)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [Community & Support](#-community--support)
- [License](#-license)

---

## 📖 Overview

**NicheAI** is an AI-powered strategic dashboard and competitor intelligence engine. It helps product teams, founders, and strategists collect, analyze, and synthesize competitor data in real time to generate actionable insights.

The platform includes:

- **Dashboard & Executive Summary**: A high-level overview of your market positioning.
- **Lens Strategy Console**: A proactive AI Product Strategist that analyzes market data and drafts actionable product features and insights.
- **Product Evolution Engine**: A comprehensive suite including the Tarpit Analyzer, Visual Intelligence Sync, Capability Gap Dashboard, and Seamless Deployment Wizard.
- **Smart LLM Routing**: Dynamic routing between AI models (Gemini, Claude, OpenAI) based on task complexity and user API keys to optimize cost and performance.
- **My Product Blueprint**: Define your product's target regions, track features, and let AI generate strategic next steps. Export your plan to One-Pagers, PRDs, or standard OpenSpec `.zip` archives.
- **Competitor Matrix**: Detailed side-by-side feature and capability comparisons.
- **Raw Data Library**: Organize incoming data streams, news mentions, and Apollo.io organization data. Easily export filtered data to CSV.
- **Insight Library**: Save and manage AI-generated strategic insights for product development. Export strategic insights to CSV.
- **Real-time Synchronization & Sync Review**: Background task engine that pulls data from web searches and API endpoints. All incoming data changes are queued for your manual review and approval before they hit the database. Global progress is clearly communicated via an elegant top-level sticky banner.
- **Support & Superadmin Hub**: Built-in feedback portals for Alpha testers, with superadmin oversight to manage limits and prioritize feature requests.

## 🚀 Tech Stack

- **Frontend**: React 19 (concurrent features), Vite 6 (with dynamic `manualChunks`), Tailwind CSS v4, Lucide Icons, Recharts, Framer Motion
- **Backend**: Express.js (BFF pattern for API proxying)
- **Data & State**: Zustand v5 (Context-Bound Vanilla Stores with `useShallow`), Firebase Firestore (real-time sync via custom queued hooks)
- **Testing**: Vitest v3, React Testing Library, JSDOM, Playwright (E2E)
- **AI Integration**: Google GenAI (Gemini), Anthropic (Claude), OpenAI
- **Data Enrichment**: Apollo.io REST API, Exa-JS Semantic Search

## 🏗 Architecture & Boundaries

The application follows a modular Single Page Application (SPA) architecture utilizing a Backend-For-Frontend (BFF) pattern.

**State Management Boundaries:**

- **Local React State (`useState`)**: Used strictly for ephemeral, component-level UI state (e.g., dropdown open/close, form input before submission).
- **Context-Bound Zustand**: Used for complex, deeply nested feature state (e.g., the Visual Whiteboard). We use `createStore` from `zustand/vanilla` injected via React Context. This isolates state per-provider (preventing test leakage) while allowing granular re-renders via `useShallow`.
- **Server State / Sync**: Handled by custom hooks (`useFirebaseSync`, `useSyncQueue`). Heavy serialization operations are explicitly deferred off the main thread to prevent UI jank.

**Component Boundaries:**
The application favors Feature-Sliced Design principles. Heavy logic and volatile state are pushed down into specific child components (e.g., `InsightEngineChat`, `JsonViewer`) rather than bloating the root `App.tsx`.

## 🧠 Design Philosophy

Our design philosophy focuses on "First Principles Education" and "Guided Journeys". We steer users away from saturated markets and toward validated, hyper-niche defensible opportunities. We prioritize specific, actionable intelligence over blank canvases. NicheAI empowers founders to understand the "why" behind the market gaps before writing code.

## 🔒 Security & Data

- **Data Sources:** We leverage the Apollo.io REST API for company firmographics and Exa-JS for semantic web searches. These provide real-time, high-fidelity competitive data.
- **Security:** Firebase Security Rules (`firestore.rules`) strictly enforce tenant isolation. BFF API routes validate session tokens before querying external AI APIs. Sensitive API keys are never exposed to the frontend.

## 🗺️ Product Roadmap & OpenSpecs

This project uses Spec-Driven Development via OpenSpec. Below is the live status of our planned, active, and completed features.

<!-- OPENSPEC_TABLE_START -->

| Feature                                | Summary                                                                                | Status      | Link                                                                 |
| -------------------------------------- | -------------------------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------- |
| ai-model-fallback                      | Introduces a unified AI client wrapping Gemini, OpenAI, and Anthropic SDKs.            | archived    | [View Spec](openspec/changes/ai-model-fallback)                      |
| analytical-template-system             | Introduces an Analytical Template System routing users into two distinct flows.        | archived    | [View Spec](openspec/changes/analytical-template-system)             |
| architecture-performance-optimization  | Extracts heavy subcomponents from App.tsx into separate files to improve performance.  | archived    | [View Spec](openspec/changes/architecture-performance-optimization)  |
| comprehensive-documentation-update     | Updates in-app guides, tooltips, and onboarding modals to reflect current features.    | archived    | [View Spec](openspec/changes/comprehensive-documentation-update)     |
| consolidate-features-modal             | Retroactively documents the Consolidate Features Modal.                                | archived    | [View Spec](openspec/changes/consolidate-features-modal)             |
| data-export-generator                  | Introduces a comprehensive data export and documentation generator across the app.     | archived    | [View Spec](openspec/changes/data-export-generator)                  |
| data-sync-review                       | Adds a Data Sync Review workflow as a gatekeeper for external data pulls.              | archived    | [View Spec](openspec/changes/data-sync-review)                       |
| dev-workflow-and-cicd                  | Implements lefthook for parallelized, high-performance local git hooks.                | archived    | [View Spec](openspec/changes/dev-workflow-and-cicd)                  |
| developer-onboarding-docs              | Proposes enhancements to developer documentation for better onboarding.                | proposed    | [View Spec](openspec/changes/developer-onboarding-docs)              |
| documentation-wizard                   | Introduces the DocumentationWizardModal for generating tailored documentation exports. | archived    | [View Spec](openspec/changes/documentation-wizard)                   |
| feature-videos                         | Transitions feature video generation to an agent-browser screenshot pipeline.          | archived    | [View Spec](openspec/changes/feature-videos)                         |
| gemini-model-upgrade-routing           | Replaces legacy models with current state-of-the-art Gemini models.                    | archived    | [View Spec](openspec/changes/gemini-model-upgrade-routing)           |
| global-progress-banner                 | Adds a GlobalProgressBanner to display active background tasks.                        | archived    | [View Spec](openspec/changes/global-progress-banner)                 |
| head-to-head-comparison                | Introduces a Head-to-Head Comparison view for up to two competitors.                   | archived    | [View Spec](openspec/changes/head-to-head-comparison)                |
| hitl-feature-merging                   | Introduces a Human-in-the-Loop merging system for competitor features.                 | archived    | [View Spec](openspec/changes/hitl-feature-merging)                   |
| hybrid-scoring-tarpit-flywheel         | Replaces stochastic LLM vibes with a deterministic Hybrid Scoring Engine.              | archived    | [View Spec](openspec/changes/hybrid-scoring-tarpit-flywheel)         |
| idea-validation-plg-teaser             | Routes unauthenticated users to a teaser branch with downgraded LLM capabilities.      | archived    | [View Spec](openspec/changes/idea-validation-plg-teaser)             |
| inject-brand-identity-prompt           | Appends brand identity styling to UI generation prompts.                               | implemented | [View Spec](openspec/changes/inject-brand-identity-prompt)           |
| insight-brainstorm-chat                | Retroactively documents the Insight Brainstorm Chat.                                   | archived    | [View Spec](openspec/changes/insight-brainstorm-chat)                |
| insight-generator-modal                | Retroactively documents the Insight Generator Modal.                                   | archived    | [View Spec](openspec/changes/insight-generator-modal)                |
| insight-quest-modal                    | Implements a gamified A/B testing interface wrapped in a farming metaphor.             | archived    | [View Spec](openspec/changes/insight-quest-modal)                    |
| interactive-tour-guide                 | Introduces a custom React 19-compatible guided tour component.                         | archived    | [View Spec](openspec/changes/interactive-tour-guide)                 |
| market-analysis-features               | Adds a tabbed interface within the MarketAnalysis component to separate features.      | archived    | [View Spec](openspec/changes/market-analysis-features)               |
| market-data-grid                       | Retroactively documents the Market Data Grid.                                          | archived    | [View Spec](openspec/changes/market-data-grid)                       |
| market-value-notebook                  | Retroactively documents the Market Value Notebook.                                     | archived    | [View Spec](openspec/changes/market-value-notebook)                  |
| marketing-video-automation             | Automates marketing video generation using mock data.                                  | archived    | [View Spec](openspec/changes/marketing-video-automation)             |
| multi-product-and-teams                | Enhances top navigation and settings to support multiple products and teams.           | archived    | [View Spec](openspec/changes/multi-product-and-teams)                |
| multiple-visual-whiteboards            | Allows users to create and manage multiple infinite-canvas whiteboards.                | archived    | [View Spec](openspec/changes/multiple-visual-whiteboards)            |
| narrative-feature-videos               | Injects an animated macOS-style SVG cursor into feature videos.                        | archived    | [View Spec](openspec/changes/narrative-feature-videos)               |
| premium-teaser-fingerprinting          | Upgrades scoring endpoint for anonymous users using premium features.                  | archived    | [View Spec](openspec/changes/premium-teaser-fingerprinting)          |
| rapid-pdlc-prompt-exporter             | Introduces a zero-cost client-side Prompt Assembler for rapid PDLC workflows.          | implemented | [View Spec](openspec/changes/rapid-pdlc-prompt-exporter)             |
| raw-data-library                       | Introduces a unified, multi-modal Raw Data Library backed by PostgreSQL.               | archived    | [View Spec](openspec/changes/raw-data-library)                       |
| remove-inspire-radio                   | Removes the InspiringRadioWidget component and its associated tests.                   | archived    | [View Spec](openspec/changes/remove-inspire-radio)                   |
| test-coverage-expansion                | Introduces unit tests for the visual knowledge store and whiteboard components.        | archived    | [View Spec](openspec/changes/test-coverage-expansion)                |
| test-coverage-expansion-phase2         | Expands unit and integration tests for hooks, utilities, and components.               | archived    | [View Spec](openspec/changes/test-coverage-expansion-phase2)         |
| test-coverage-tarpit-tollgate          | Implements a comprehensive Boundary Testing Approach using Vitest and MSW.             | archived    | [View Spec](openspec/changes/test-coverage-tarpit-tollgate)          |
| testing-architecture-modernization     | Shifts testing architecture to the Testing Trophy methodology.                         | archived    | [View Spec](openspec/changes/testing-architecture-modernization)     |
| ast-driven-drift-healing               | Upgrades documentation drift detection to use AST parsing.                             | archived    | [View Spec](openspec/changes/ast-driven-drift-healing)               |
| atomic-staging-safeguards              | Introduces Atomic Staging Safeguards to the OpenSpec CLI.                              | archived    | [View Spec](openspec/changes/atomic-staging-safeguards)              |
| bq-search-signals                      | Implements logic to execute native partitioned BigQuery queries.                       | archived    | [View Spec](openspec/changes/bq-search-signals)                      |
| brand-positioning-wizard               | Introduces a Brand Identity & Positioning Wizard to parse competitor identities.       | implemented | [View Spec](openspec/changes/brand-positioning-wizard)               |
| bug-hunt-test-review                   | Conducts a thorough bug hunt and adds missing test coverage.                           | archived    | [View Spec](openspec/changes/bug-hunt-test-review)                   |
| calibrated-transparent-ai              | Implements a suite of Calibrated Trust UX and backend patterns.                        | archived    | [View Spec](openspec/changes/calibrated-transparent-ai)              |
| cloud-run-scale-to-zero                | Introduces a multi-stage Docker build transitioning to a distroless runtime.           | archived    | [View Spec](openspec/changes/cloud-run-scale-to-zero)                |
| cloud-tasks-local-simulator            | Integrates the Firebase Emulator Suite for true offline development.                   | archived    | [View Spec](openspec/changes/cloud-tasks-local-simulator)            |
| cloudflare-deployment-analytics-engine | Migrates to a production-grade deployment and analytics infrastructure.                | archived    | [View Spec](openspec/changes/cloudflare-deployment-analytics-engine) |
| codebase-test-quality-review           | Conducts a structured review of the codebase to discover latent bugs.                  | archived    | [View Spec](openspec/changes/codebase-test-quality-review)           |
| competitor-discovery-frontend          | Updates synchronization logic to handle empty competitor arrays.                       | completed   | [View Spec](openspec/changes/competitor-discovery-frontend)          |
| competitor-discovery-review            | Introduces a Human-in-the-Loop Competitor Curation step.                               | implemented | [View Spec](openspec/changes/competitor-discovery-review)            |
| comprehensive-documentation            | Overhauls platform documentation and user onboarding guides.                           | archived    | [View Spec](openspec/changes/comprehensive-documentation)            |
| comprehensive-test-coverage            | Introduces comprehensive intent-based testing using Vitest and MSW.                    | archived    | [View Spec](openspec/changes/comprehensive-test-coverage)            |
| deduplication-algorithm                | Formalizes a Tri-Tiered Waterfall Matching Strategy for raw data inputs.               | archived    | [View Spec](openspec/changes/deduplication-algorithm)                |
| dummy-spec                             | Implementation with no proposal provided.                                              | implemented | [View Spec](openspec/changes/dummy-spec)                             |
| dynamic-test-scaling                   | Introduces a hardware-aware resource allocation strategy for test running.             | archived    | [View Spec](openspec/changes/dynamic-test-scaling)                   |
| educational-tone-refactor              | Refactors the global CO-STAR rule to incorporate educational complexity scaling.       | implemented | [View Spec](openspec/changes/educational-tone-refactor)              |
| enterprise-ml-orchestration            | Routes tasks to model tiers using Multi-Armed Bandits.                                 | archived    | [View Spec](openspec/changes/enterprise-ml-orchestration)            |
| exa-api-key-fallback                   | Introduces a secondary Exa API key as a fallback.                                      | archived    | [View Spec](openspec/changes/exa-api-key-fallback)                   |
| fetch-with-app-check-fix               | Wraps the getIdToken call in an exponential backoff retry utility.                     | completed   | [View Spec](openspec/changes/fetch-with-app-check-fix)               |
| global-anonymous-limits                | Adds a global counter in Firestore to track anonymous teaser runs.                     | superseded  | [View Spec](openspec/changes/global-anonymous-limits)                |
| hyper-scale-saas-data-moat-pipeline    | Introduces a Serverless Extraction & LLM Synthesis architecture.                       | archived    | [View Spec](openspec/changes/hyper-scale-saas-data-moat-pipeline)    |
| ideation-workflow                      | Overhauls the onboarding and product definition experience.                            | superseded  | [View Spec](openspec/changes/ideation-workflow)                      |
| image-import                           | Extends the UploadDataModal to accept image files directly.                            | archived    | [View Spec](openspec/changes/image-import)                           |
| intent-based-testing                   | Rolls out an intent-based testing suite for all P0 features.                           | implemented | [View Spec](openspec/changes/intent-based-testing)                   |
| ml-orchestration-system                | Replaces static model routing with dynamically weighted asynchronous routing.          | implemented | [View Spec](openspec/changes/ml-orchestration-system)                |
| mlp-hands-on-review                    | Conducts a comprehensive hands-on product review across four key areas.                | archived    | [View Spec](openspec/changes/mlp-hands-on-review)                    |
| multi-category-mentions                | Introduces an autocomplete mention system using Tiptap and Supabase.                   | archived    | [View Spec](openspec/changes/multi-category-mentions)                |
| multi-product-workspace                | Introduces a WorkspaceProvider to manage active products natively.                     | archived    | [View Spec](openspec/changes/multi-product-workspace)                |
| mvp-analytics-superadmin               | Replaces complex analytics visualizations with a simple Magic Login table.             | archived    | [View Spec](openspec/changes/mvp-analytics-superadmin)               |
| navbar-logical-ordering                | Reorders sidebar navigation to reflect a workflow-based pattern.                       | archived    | [View Spec](openspec/changes/navbar-logical-ordering)                |
| next-gen-analytics                     | Introduces a dynamic reporting canvas built on Recharts and Framer Motion.             | archived    | [View Spec](openspec/changes/next-gen-analytics)                     |
| niche-radar-plg-loop                   | Implements a Reverse Demo model to convert unauthenticated users.                      | archived    | [View Spec](openspec/changes/niche-radar-plg-loop)                   |
| nicheai-ux-strategy                    | Implements intent-based routing to reduce decision fatigue during onboarding.          | implemented | [View Spec](openspec/changes/nicheai-ux-strategy)                    |
| openspec-agent-cli-upgrade             | Refactors the CLI to support both interactive and non-interactive workflows.           | archived    | [View Spec](openspec/changes/openspec-agent-cli-upgrade)             |
| openspec-continual-learning            | Introduces a Continual Learning & Extraction phase into the lifecycle.                 | implemented | [View Spec](openspec/changes/openspec-continual-learning)            |
| openspec-documentation-unification     | Establishes an 8-step lifecycle by explicitly adding the Validate phase.               | implemented | [View Spec](openspec/changes/openspec-documentation-unification)     |
| openspec-intent-based-testing          | Updates workflow to require intent-based testing for all new features.                 | implemented | [View Spec](openspec/changes/openspec-intent-based-testing)          |
| performance-optimization               | Introduces code-splitting and defers loading of heavy AI SDKs.                         | archived    | [View Spec](openspec/changes/performance-optimization)               |
| plg-architecture-remediation           | Migrates the anonymous rate limit from Firestore to Redis.                             | archived    | [View Spec](openspec/changes/plg-architecture-remediation)           |
| plg-builder-journey                    | Documents the PLG Builder Paradigm Journey context and objectives.                     | archived    | [View Spec](openspec/changes/plg-builder-journey)                    |
| plg-journey-optimization               | Overhauls the PLG-to-Workspace journey by stabilizing streaming UI.                    | archived    | [View Spec](openspec/changes/plg-journey-optimization)               |
| plg-reverse-demo-hook                  | Stabilizes streaming UI and state hydration across the auth boundary.                  | archived    | [View Spec](openspec/changes/plg-reverse-demo-hook)                  |
| plg-teaser-idea-validation             | Routes and implements Remote Config model resolution for unauthenticated users.        | archived    | [View Spec](openspec/changes/plg-teaser-idea-validation)             |
| plg-ux-bifurcation                     | Bifurcates the UX and IA at the Zero Friction Entry based on user intent.              | archived    | [View Spec](openspec/changes/plg-ux-bifurcation)                     |
| pql-reverse-demo-trust-builder         | Revamps ideation into a Trust-Building Progressive Disclosure journey.                 | archived    | [View Spec](openspec/changes/pql-reverse-demo-trust-builder)         |
| pql-trust-builder                      | Revamps the ideation flow into a high-converting PQL gate.                             | archived    | [View Spec](openspec/changes/pql-trust-builder)                      |
| proactive-market-analysis              | Introduces a progressive sync banner for background task progress.                     | archived    | [View Spec](openspec/changes/proactive-market-analysis)              |
| product-evolution-engine               | Evolves NicheAI into an Evolution Engine using market data ingestion.                  | superseded  | [View Spec](openspec/changes/product-evolution-engine)               |
| raw-data-image-storage                 | Introduces persistent cloud storage for user-uploaded images via Supabase.             | archived    | [View Spec](openspec/changes/raw-data-image-storage)                 |
| react19-firebase-sync                  | Adopts a snapshot-only approach for Firebase metadata syncs.                           | completed   | [View Spec](openspec/changes/react19-firebase-sync)                  |
| reverse-demo-hook-plg                  | Removes initial AuthScreen and replaces multi-step onboarding with a single input.     | archived    | [View Spec](openspec/changes/reverse-demo-hook-plg)                  |
| sanitize-system-logs                   | Sanitizes log messages and hides sensitive details from non-superadmins.               | archived    | [View Spec](openspec/changes/sanitize-system-logs)                   |
| scale-to-zero-deployment-docs          | Updates README with a Scale-to-Zero Deployment Guide.                                  | archived    | [View Spec](openspec/changes/scale-to-zero-deployment-docs)          |
| smart-llm-routing                      | Introduces an Auto Smart Routing mode as the default AI behavior.                      | archived    | [View Spec](openspec/changes/smart-llm-routing)                      |
| strategy-toolbox                       | Replaces static analytical templates with a dynamic, data-driven Strategy Toolbox.     | archived    | [View Spec](openspec/changes/strategy-toolbox)                       |
| supabase-integration                   | Adds database multi-tenancy and updates the Supabase client.                           | archived    | [View Spec](openspec/changes/supabase-integration)                   |
| superadmin-data-quality-control        | Adds a Data Quality & Control tab to the Superadmin Dashboard.                         | archived    | [View Spec](openspec/changes/superadmin-data-quality-control)        |
| superadmin-feature-controls            | Adds a View-As toggle to temporarily drop superadmin privileges.                       | archived    | [View Spec](openspec/changes/superadmin-feature-controls)            |
| sync-fallback                          | Implements a synchronous fallback path and Circuit Breaker for hyper-niches.           | archived    | [View Spec](openspec/changes/sync-fallback)                          |
| system-logs-ux                         | Maps internal tools to generic labels and refactors API details in system logs.        | archived    | [View Spec](openspec/changes/system-logs-ux)                         |
| test-coverage-and-quality              | Adds comprehensive test suites using Vitest, RTL, and MSW for UI components.           | archived    | [View Spec](openspec/changes/test-coverage-and-quality)              |
| test-coverage-expansion                | Enforces an 80% test coverage threshold using Vitest v8 provider.                      | implemented | [View Spec](openspec/changes/test-coverage-expansion)                |
| test-coverage-quality                  | Adds intent-based tests for recently modified files using Vitest and RTL.              | archived    | [View Spec](openspec/changes/test-coverage-quality)                  |
| tooltip-activation-fix                 | Updates the SyncNowButton wrapper to correct tooltip activation issues.                | archived    | [View Spec](openspec/changes/tooltip-activation-fix)                 |
| unified-ideation-and-evolution         | Overhauls the initial onboarding and product ideation experience.                      | archived    | [View Spec](openspec/changes/unified-ideation-and-evolution)         |
| update-coverage-threshold-80           | Enforces an 80% test coverage threshold across the repository.                         | implemented | [View Spec](openspec/changes/update-coverage-threshold-80)           |
| url-onboarding-plg                     | Introduces a new flow allowing users to input a URL for zero-friction entry.           | archived    | [View Spec](openspec/changes/url-onboarding-plg)                     |

<!-- OPENSPEC_TABLE_END -->

## 📈 Recent Momentum

<!-- GIT_HISTORY_START -->

- feat: added tests for NodeGraphPipeline
- feat: added tests and remaining components for plg builder
- fix: import vi in ConstraintEngine.test.tsx
- fix: use vi.fn instead of vitest.fn
- ci: add firestore rules deployment step and fix rules syntax
- fix(vite): dedupe firebase imports to fix auth state race condition in PLG funnel
- fix(auth): unblock PLG flow by making AppCheck opt-in
- fix(deploy): inject Firebase API key at Vite build time
- fix(build): resolve React 19 Activity crash from chunk splitting
- fix(deploy): resolve Cloud Run startup crashes and infra sizing
<!-- GIT_HISTORY_END -->

## 🎯 Sprint Insights & Tech Debt

<!-- TECH_DEBT_START -->

No outstanding technical debt or scope creep.

<!-- TECH_DEBT_END -->

## 💻 Local Development Setup (Quick Start)

Follow these instructions to get the project up and running on your local machine in under 10 minutes.

### Prerequisites

| Requirement | Version | Notes                        |
| ----------- | ------- | ---------------------------- |
| Node.js     | v20.x   | We recommend using `nvm use` |
| npm         | v10.x   | Included with Node           |

### Quick Start

1. Clone the repository and install dependencies:

```bash
git clone https://github.com/your-org/nicheai.git
cd nicheai
npm install
```

2. Set up your environment variables:

```bash
cp .env.example .env
```

3. Configure your API keys in the `.env` file:

```env
# Google Gemini API key for generating insights
GEMINI_API_KEY="your_gemini_api_key_here"

# The hosted URL for the application
APP_URL="http://localhost:3000"

# Apollo.io API key for fetching company firmographics
APOLLO_API_KEY="your_apollo_api_key_here"

# Google Custom Search API for competitor news
GOOGLE_SEARCH_API_KEY="your_google_search_api_key_here"
GOOGLE_SEARCH_ENGINE_ID="your_google_search_engine_id_here"
```

_(Note: The app will boot with dummy keys, but data enrichment and AI features require valid API keys.)_

4. Start the development server:

```bash
npm run dev
```

The application will be available at **[http://localhost:3000](http://localhost:3000)**.

### Local Troubleshooting & Configuration

- **API Rate Limits**: The AI clients (`aiClient.ts`, `geminiClient.ts`) handle `429` rate limits dynamically. Ensure you monitor the in-app Usage Tracker during extensive testing. If you exhaust a key, fallback mechanisms will attempt to use alternative models.
- **Firebase Sync Conflicts**: `useFirebaseSync` includes debounced logic and error trapping. If testing offline scenarios, rely on `firebase.ts` built-in offline persistence. Check console logs for `resource-exhausted` quotas.
- **Test State Leaks**: Tests are wrapped with `<VisualKnowledgeProvider>` in `src/test-utils/render.tsx` to isolate Zustand state. Ensure any new tests utilizing context-bound stores import `render` from `test-utils` rather than `@testing-library/react`.

---

## 🛠 Available Scripts

| Command                    | Description                                                                                                 |
| -------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `npm run dev`              | Starts the Express server with Vite middleware in development mode with Hot Module Replacement (HMR).       |
| `npm run build`            | Builds the React frontend into static assets in the `/dist` directory.                                      |
| `npm run start`            | Runs the production Express server, serving the static assets from `/dist`.                                 |
| `npm run lint`             | Runs the TypeScript compiler to check for type errors without emitting files.                               |
| `npm run test`             | Runs the Vitest test suite.                                                                                 |
| `npm run test:e2e`         | Runs the Playwright end-to-end tests.                                                                       |
| `npm run generate-videos`  | Auto-generates UI walkthrough videos via Playwright for landing pages and docs.                             |
| `npm run clean`            | Removes the `/dist` build directory.                                                                        |
| `npm run swe-bench-runner` | Runs the custom SWE-bench evaluation loop to empirically test the local AI Agent setup used in development. |

---

## 🤖 AI Agent Benchmarking (SWE-Bench)

This repository includes a custom automated benchmark to evaluate the performance of our customized **Cursor AI Agent** (powered by Gemini 3.1 Pro) using the `aider-chat` CLI.

> **⚠️ Important note for other developers:** This benchmark is highly specific to the **Cursor IDE ecosystem**. The tests (`task-*.md`) specifically evaluate the agent's ability to trigger custom Cursor-native skills (e.g., `using-superml`, `ml-plan`) and query local MCP servers configured in `.cursor/projects/`. If you are using a different AI coding assistant (like Claude Code, GitHub Copilot, or vanilla Aider), this benchmark will likely fail or require significant modification, as those environments do not natively support Cursor's custom rules or MCP tool injection mechanisms.

The benchmark evaluates whether the Cursor agent properly follows our architecture rules, executes required skills (like linting or ML planning), and leverages our specific MCP (Model Context Protocol) servers.

### Running the Benchmark

You can run the full evaluation loop using the provided npm script:

```bash
npm run swe-bench-runner
```

This script will:

1. Iterate over 3 configurations (Baseline, Prompts only, Full Stack).
2. Execute 5 specific tasks (`task-*.md`) across the codebase.
3. Automatically grade the agent's patches using Vitest and Bash scripts in the `eval_tests/` directory.
4. Output the pass/fail results to a `swe-bench-results.log` file.

**Tasks Evaluated:**

- **Task 1 (Rules):** Verifies adherence to the `.cursorrules` (e.g., CO-STAR format, top-level imports, exhaustive TypeScript switches).
- **Task 2 (Skills):** Checks if the agent successfully triggers linting (`npm run lint`) and fixes type errors.
- **Task 3 (MCP Forcing):** Forces the agent to use the Context7 MCP server to fetch up-to-date documentation before implementing a D3.js chart.
- **Task 4 (ML Planning):** Validates that the agent correctly triggers `ml-plan` and `using-superml` skills to design a recommendation engine pipeline.
- **Task 5 (ML Debugging):** Validates that the agent uses the `ml-debug` skill to generate a debugging checklist for NaN loss issues.

For more details on the benchmark design, refer to the [task files](task-1-rules.md) and [test scripts](eval_tests/).

---

## 🧪 Testing

This project uses **Vitest** alongside **React Testing Library** to ensure reliability.

### Running Tests

To run the complete test suite (unit and integration tests):

```bash
npm run test
```

### Test Coverage Highlights

- **`useLocalStorage.test.tsx`**: Validates custom hook side-effects, cache synchronization, and correct behavior without violating React state mutations.
- **`pagination.test.ts`**: Verifies zero-index boundaries and edge cases for data grids.
- **`App.test.tsx`**: Mounts the full application, testing navigation consistency and ensuring global components (like the Background Sync Engine) don't duplicate across tabs.

---

## 📂 Project Structure

```text
├── openspec/
│   └── changes/          # OpenSpec files (proposal, design, tasks) for new features
├── e2e/                  # Playwright end-to-end tests and db seeds
├── src/
│   ├── components/       # Reusable React components & Modals
│   ├── hooks/            # Custom React Hooks (e.g., useFirebaseSync)
│   ├── utils/            # Helper functions (e.g., pagination bounds)
│   ├── __tests__/        # Unit and Integration test files
│   ├── App.tsx           # Main application shell and routing state
│   ├── main.tsx          # React DOM entry point
│   ├── types.ts          # TypeScript type definitions
│   └── firebase.ts       # Firebase initialization and offline support
├── server.ts             # Express server entry point (Dev & Prod)
├── package.json          # Project metadata and dependencies
├── vite.config.ts        # Vite build and test configuration
├── firestore.rules       # Firebase security rules
├── swe-bench-runner.sh   # Evaluation loop script for the SWE-Bench test suite
├── eval_tests/           # Grading tests to evaluate the AI Agent's output
└── task-*.md             # Aider benchmark issues (Task 1 to 5)
```

## 🤝 Contributing

This project is strictly proprietary and closed-source. We do not accept external pull requests.

If you are an internal team member or contractor, please refer to our internal **[CONTRIBUTING.md](CONTRIBUTING.md)** guide for:

- Our mandatory OpenSpec feature planning workflow.
- Conventional Commits enforced by Lefthook.
- Testing, Squashing, and Merging PR policies.

## 💬 Community & Support

For customers requiring support or wishing to report bugs, please contact us directly:

- **Email Support:** [support@nicheai.com](mailto:support@nicheai.com)
- **Security Disclosures:** If you believe you have found a security vulnerability, please securely email [security@nicheai.com](mailto:security@nicheai.com) instead of opening a public issue.

## 📄 License

**Copyright (c) 2026 NicheAI. All Rights Reserved.**

This software and associated documentation files are the proprietary and confidential property of NicheAI. Use, copying, modification, merging, publishing, distribution, sublicensing, and/or selling copies of the Software is strictly prohibited without express written permission. See the [LICENSE](LICENSE) file for complete details.
