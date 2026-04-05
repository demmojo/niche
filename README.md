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

| Feature                                | Summary                                                                                                                            | Status      | Link                                                            |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------- | --------------------------------------------------------------- |
| ai-model-fallback                      | We are introducing a unified AI client that wraps Gemini, OpenAI, and Anthropic SDKs.                                              | archived    | [Link](openspec/changes/ai-model-fallback)                      |
| analytical-template-system             | Introduce a unified Analytical Template System that routes users into two distinct flows.                                          | archived    | [Link](openspec/changes/analytical-template-system)             |
| architecture-performance-optimization  | Extract heavy subcomponents from App.tsx into separate files and push volatile state down the component tree.                      | archived    | [Link](openspec/changes/architecture-performance-optimization)  |
| comprehensive-documentation-update     | Update in-app guides, tooltips, onboarding modals, and help pages to reflect the current feature set and UI changes.               | archived    | [Link](openspec/changes/comprehensive-documentation-update)     |
| consolidate-features-modal             | Retroactive documentation of the Consolidate Features Modal feature.                                                               | archived    | [Link](openspec/changes/consolidate-features-modal)             |
| data-export-generator                  | Introduce a Comprehensive Data Export & Documentation Generator feature across the application.                                    | archived    | [Link](openspec/changes/data-export-generator)                  |
| data-sync-review                       | Introduce a universal Data Sync Review workflow to act as a gatekeeper for all external data pulls and AI-generated state updates. | archived    | [Link](openspec/changes/data-sync-review)                       |
| dev-workflow-and-cicd                  | Implementing lefthook for parallelized, high-performance local git hooks.                                                          | archived    | [Link](openspec/changes/dev-workflow-and-cicd)                  |
| developer-onboarding-docs              | Our current developer documentation needs to be enhanced to ensure smoother onboarding.                                            | proposed    | [Link](openspec/changes/developer-onboarding-docs)              |
| documentation-wizard                   | Introduces the DocumentationWizardModal allowing users to generate and download comprehensive documentation.                       | archived    | [Link](openspec/changes/documentation-wizard)                   |
| feature-videos                         | Transition the feature video generation pipeline to an agent-browser architecture.                                                 | archived    | [Link](openspec/changes/feature-videos)                         |
| gemini-model-upgrade-routing           | Complete removal of legacy models, replacing them with the current state-of-the-art models.                                        | archived    | [Link](openspec/changes/gemini-model-upgrade-routing)           |
| global-progress-banner                 | Introduces a GlobalProgressBanner component to display active asynchronous data fetching operations.                               | archived    | [Link](openspec/changes/global-progress-banner)                 |
| head-to-head-comparison                | Introducing a Head-to-Head Comparison view allowing selection of up to 2 competitors.                                              | archived    | [Link](openspec/changes/head-to-head-comparison)                |
| hitl-feature-merging                   | Users can select multiple similar competitor features and merge them into a new feature.                                           | archived    | [Link](openspec/changes/hitl-feature-merging)                   |
| hybrid-scoring-tarpit-flywheel         | We are replacing stochastic LLM vibes with a mathematically rigorous Hybrid Scoring Engine.                                        | archived    | [Link](openspec/changes/hybrid-scoring-tarpit-flywheel)         |
| idea-validation-plg-teaser             | Route unauthenticated users to a teaser branch with downgraded LLM constraints.                                                    | archived    | [Link](openspec/changes/idea-validation-plg-teaser)             |
| inject-brand-identity-prompt           | Add a pure function to format and append the ProjectBrandIdentity to AI generation payloads.                                       | implemented | [Link](openspec/changes/inject-brand-identity-prompt)           |
| insight-brainstorm-chat                | Retroactive documentation of the Insight Brainstorm Chat feature.                                                                  | archived    | [Link](openspec/changes/insight-brainstorm-chat)                |
| insight-generator-modal                | Retroactive documentation of the Insight Generator Modal feature.                                                                  | archived    | [Link](openspec/changes/insight-generator-modal)                |
| insight-quest-modal                    | Documenting the implementation of the InsightQuestModal, a gamified A/B testing interface.                                         | archived    | [Link](openspec/changes/insight-quest-modal)                    |
| interactive-tour-guide                 | A custom, lightweight, React 19-compatible guided tour component powered by Framer Motion.                                         | archived    | [Link](openspec/changes/interactive-tour-guide)                 |
| market-analysis-features               | Introducing a tabbed interface within the MarketAnalysis component to separate conversational AI from Deep Dive reports.           | archived    | [Link](openspec/changes/market-analysis-features)               |
| market-data-grid                       | Retroactive documentation of the Market Data Grid feature.                                                                         | archived    | [Link](openspec/changes/market-data-grid)                       |
| market-value-notebook                  | Retroactive documentation of the Market Value Notebook feature.                                                                    | archived    | [Link](openspec/changes/market-value-notebook)                  |
| marketing-video-automation             | Implementing Marketing Video Automation & Mock Data to streamline video generation.                                                | archived    | [Link](openspec/changes/marketing-video-automation)             |
| multi-product-and-teams                | Enhancing the product dropdown to support adding new products and teams.                                                           | archived    | [Link](openspec/changes/multi-product-and-teams)                |
| multiple-visual-whiteboards            | Users can create, name, and switch between multiple infinite-canvas whiteboards.                                                   | archived    | [Link](openspec/changes/multiple-visual-whiteboards)            |
| narrative-feature-videos               | Upgrading scripts to inject a highly-realistic, animated macOS-style SVG cursor.                                                   | archived    | [Link](openspec/changes/narrative-feature-videos)               |
| premium-teaser-fingerprinting          | Upgrade scoring endpoint to utilize pro models for anonymous users.                                                                | archived    | [Link](openspec/changes/premium-teaser-fingerprinting)          |
| rapid-pdlc-prompt-exporter             | We are introducing a Rapid PDLC Workflow consisting of a zero-cost client-side Prompt Assembler.                                   | implemented | [Link](openspec/changes/rapid-pdlc-prompt-exporter)             |
| raw-data-library                       | We are introducing a unified, multi-modal Raw Data Library backed by PostgreSQL.                                                   | archived    | [Link](openspec/changes/raw-data-library)                       |
| remove-inspire-radio                   | Complete removal of the InspiringRadioWidget component and its associated tests.                                                   | archived    | [Link](openspec/changes/remove-inspire-radio)                   |
| test-coverage-expansion                | Introducing a comprehensive suite of unit tests for the visual knowledge store and whiteboard UI.                                  | archived    | [Link](openspec/changes/test-coverage-expansion)                |
| test-coverage-expansion-phase2         | Introducing new unit and integration tests for hooks, utilities, and components.                                                   | archived    | [Link](openspec/changes/test-coverage-expansion-phase2)         |
| test-coverage-tarpit-tollgate          | Implement a comprehensive Boundary Testing Approach using Vitest, MSW, Supertest, and Playwright.                                  | archived    | [Link](openspec/changes/test-coverage-tarpit-tollgate)          |
| testing-architecture-modernization     | Modernizing testing architecture by transitioning to the Testing Trophy methodology.                                               | archived    | [Link](openspec/changes/testing-architecture-modernization)     |
| ast-driven-drift-healing               | Transform documentation drift detection into a proactive, self-healing Strategic Sprint Engine.                                    | archived    | [Link](openspec/changes/ast-driven-drift-healing)               |
| atomic-staging-safeguards              | Introducing Atomic Staging Safeguards to the OpenSpec CLI.                                                                         | archived    | [Link](openspec/changes/atomic-staging-safeguards)              |
| bq-search-signals                      | Implement logic to execute native partitioned queries enforcing structured schema schemas.                                         | archived    | [Link](openspec/changes/bq-search-signals)                      |
| brand-positioning-wizard               | We are introducing a Brand Identity & Positioning Wizard.                                                                          | implemented | [Link](openspec/changes/brand-positioning-wizard)               |
| bug-hunt-test-review                   | Implement rigorous testing standards across the repository.                                                                        | archived    | [Link](openspec/changes/bug-hunt-test-review)                   |
| calibrated-transparent-ai              | Implementing Calibrated Trust suite with cryptographically verifiable Zero Data Retention receipts.                                | archived    | [Link](openspec/changes/calibrated-transparent-ai)              |
| cloud-run-scale-to-zero                | Introduce a multi-stage Docker build transitioning to a distroless runtime environment.                                            | archived    | [Link](openspec/changes/cloud-run-scale-to-zero)                |
| cloud-tasks-local-simulator            | Refactor the local development setup to ensure true offline operation via Firebase Emulator.                                       | archived    | [Link](openspec/changes/cloud-tasks-local-simulator)            |
| cloudflare-deployment-analytics-engine | Transition from mocked components to a production-grade deployment and analytics infrastructure.                                   | archived    | [Link](openspec/changes/cloudflare-deployment-analytics-engine) |
| codebase-test-quality-review           | A comprehensive review to discover latent bugs, improve test quality, and ensure system robustness.                                | archived    | [Link](openspec/changes/codebase-test-quality-review)           |
| competitor-discovery-frontend          | Update frontend to handle global sync competitor states.                                                                           | completed   | [Link](openspec/changes/competitor-discovery-frontend)          |
| competitor-discovery-review            | Intercept deep validation to introduce synchronous Human-in-the-Loop Competitor Curation.                                          | implemented | [Link](openspec/changes/competitor-discovery-review)            |
| comprehensive-documentation            | A massive platform-wide overhaul of all documentation and user onboarding guides.                                                  | archived    | [Link](openspec/changes/comprehensive-documentation)            |
| comprehensive-test-coverage            | Introduces comprehensive intent-based testing using Vitest, RTL, and MSW.                                                          | archived    | [Link](openspec/changes/comprehensive-test-coverage)            |
| deduplication-algorithm                | Formalizing a Tri-Tiered Waterfall Matching Strategy to identify related raw data.                                                 | archived    | [Link](openspec/changes/deduplication-algorithm)                |
| dummy-spec                             | No proposal found.                                                                                                                 | implemented | [Link](openspec/changes/dummy-spec)                             |
| dynamic-test-scaling                   | Introduces a dynamic, hardware-and-environment-aware resource allocation strategy for the test runner.                             | archived    | [Link](openspec/changes/dynamic-test-scaling)                   |
| educational-tone-refactor              | The global CO-STAR User Rule will be refactored to incorporate the Anchor and Define pattern.                                      | implemented | [Link](openspec/changes/educational-tone-refactor)              |
| enterprise-ml-orchestration            | Capability-Driven Smart Routing using Multi-Armed Bandits for adaptive routing.                                                    | archived    | [Link](openspec/changes/enterprise-ml-orchestration)            |
| exa-api-key-fallback                   | Introducing a secondary Exa API key to be used as a fallback in our code.                                                          | archived    | [Link](openspec/changes/exa-api-key-fallback)                   |
| fetch-with-app-check-fix               | Wrap the getIdToken call in a robust exponential backoff retry utility.                                                            | completed   | [Link](openspec/changes/fetch-with-app-check-fix)               |
| global-anonymous-limits                | Add a global counter in Firestore that tracks total anonymous teaser runs.                                                         | superseded  | [Link](openspec/changes/global-anonymous-limits)                |
| hyper-scale-saas-data-moat-pipeline    | Replaces basic directories with a Serverless Extraction & LLM Synthesis architecture.                                              | archived    | [Link](openspec/changes/hyper-scale-saas-data-moat-pipeline)    |
| ideation-workflow                      | Overhaul of the onboarding and product definition experience.                                                                      | superseded  | [Link](openspec/changes/ideation-workflow)                      |
| image-import                           | Extend the UploadDataModal to accept image files.                                                                                  | archived    | [Link](openspec/changes/image-import)                           |
| intent-based-testing                   | Roll out an intent-based testing suite for all P0 features.                                                                        | implemented | [Link](openspec/changes/intent-based-testing)                   |
| ml-orchestration-system                | Replace static model routing with Contextual Queueing Bandits.                                                                     | implemented | [Link](openspec/changes/ml-orchestration-system)                |
| mlp-hands-on-review                    | Comprehensive, hands-on product review spanning four key areas.                                                                    | archived    | [Link](openspec/changes/mlp-hands-on-review)                    |
| multi-category-mentions                | A real-time, multi-category autocomplete mention system for the chat interface.                                                    | archived    | [Link](openspec/changes/multi-category-mentions)                |
| multi-product-workspace                | Introduce a native WorkspaceProvider using React Context to manage active products.                                                | archived    | [Link](openspec/changes/multi-product-workspace)                |
| mvp-analytics-superadmin               | Replace over-engineered visualizations with a Magic Login table.                                                                   | archived    | [Link](openspec/changes/mvp-analytics-superadmin)               |
| navbar-logical-ordering                | Reorder sidebar navigation items logically to reflect workflow-based patterns.                                                     | archived    | [Link](openspec/changes/navbar-logical-ordering)                |
| next-gen-analytics                     | Introduce the Next-Gen Analytics Platform to replace static data views.                                                            | archived    | [Link](openspec/changes/next-gen-analytics)                     |
| niche-radar-plg-loop                   | Leverage a Reverse Demo model to deliver instant value via Product-Led Growth engine.                                              | archived    | [Link](openspec/changes/niche-radar-plg-loop)                   |
| nicheai-ux-strategy                    | Implementation of Intent-Based Routing and Progressive Disclosure to reduce decision fatigue.                                      | implemented | [Link](openspec/changes/nicheai-ux-strategy)                    |
| openspec-agent-cli-upgrade             | Refactor the CLI into a Dual-Mode tool bridging human interactive and agentic workflows.                                           | archived    | [Link](openspec/changes/openspec-agent-cli-upgrade)             |
| openspec-continual-learning            | Introduce a Continual Learning & Extraction phase into the OpenSpec lifecycle.                                                     | implemented | [Link](openspec/changes/openspec-continual-learning)            |
| openspec-documentation-unification     | Establish an 8-Step Lifecycle by explicitly adding the Validate phase.                                                             | implemented | [Link](openspec/changes/openspec-documentation-unification)     |
| openspec-intent-based-testing          | Require intent-based testing for new feature implementations via custom workflow rules.                                            | implemented | [Link](openspec/changes/openspec-intent-based-testing)          |
| performance-optimization               | Introduce aggressive code-splitting and native memoization for performance optimization.                                           | archived    | [Link](openspec/changes/performance-optimization)               |
| plg-architecture-remediation           | Transition the global anonymous rate limit from Firestore to a Redis distributed counter.                                          | archived    | [Link](openspec/changes/plg-architecture-remediation)           |
| plg-journey-optimization               | Overhaul the PLG-to-Workspace journey by stabilizing the streaming UI.                                                             | archived    | [Link](openspec/changes/plg-journey-optimization)               |
| plg-reverse-demo-hook                  | Stabilize streaming UI and ensure state hydration across auth boundary.                                                            | archived    | [Link](openspec/changes/plg-reverse-demo-hook)                  |
| plg-teaser-idea-validation             | Route API scoring stream to detect unauthenticated users and apply Remote Config limits.                                           | archived    | [Link](openspec/changes/plg-teaser-idea-validation)             |
| plg-ux-bifurcation                     | Explicitly bifurcate UX and IA at Zero Friction Entry to separate user intents.                                                    | archived    | [Link](openspec/changes/plg-ux-bifurcation)                     |
| pql-reverse-demo-trust-builder         | Revamp ideation flow into a Trust-Building Progressive Disclosure journey.                                                         | archived    | [Link](openspec/changes/pql-reverse-demo-trust-builder)         |
| pql-trust-builder                      | Revamp ideation flow into a Trust-Building Progressive Disclosure journey.                                                         | archived    | [Link](openspec/changes/pql-trust-builder)                      |
| proactive-market-analysis              | Introduce a progressive sync banner that displays real-time background task progress.                                              | archived    | [Link](openspec/changes/proactive-market-analysis)              |
| product-evolution-engine               | Evolve static My Product object tracking into a comprehensive Evolution Engine.                                                    | superseded  | [Link](openspec/changes/product-evolution-engine)               |
| raw-data-image-storage                 | Introduce persistent cloud storage for user-uploaded images using Supabase Storage.                                                | archived    | [Link](openspec/changes/raw-data-image-storage)                 |
| react19-firebase-sync                  | Adopt a Snapshot-Only approach for Firebase fetches to leverage built-in caching.                                                  | completed   | [Link](openspec/changes/react19-firebase-sync)                  |
| reverse-demo-hook-plg                  | Remove initial AuthScreen and replace onboarding with a single input for Zero-Friction Entry.                                      | archived    | [Link](openspec/changes/reverse-demo-hook-plg)                  |
| sanitize-system-logs                   | Hide context details in System Logs UI for non-superadmins and obfuscate sensitive data.                                           | archived    | [Link](openspec/changes/sanitize-system-logs)                   |
| scale-to-zero-deployment-docs          | Update README with a comprehensive Scale-to-Zero Deployment Guide.                                                                 | archived    | [Link](openspec/changes/scale-to-zero-deployment-docs)          |
| smart-llm-routing                      | Introduce an Auto Smart Routing mode as the default behavior for AI flows.                                                         | archived    | [Link](openspec/changes/smart-llm-routing)                      |
| strategy-toolbox                       | Replace static template library with a dynamic, data-driven Strategy Toolbox.                                                      | archived    | [Link](openspec/changes/strategy-toolbox)                       |
| supabase-integration                   | Add database multi-tenancy support via team_id assignments.                                                                        | archived    | [Link](openspec/changes/supabase-integration)                   |
| superadmin-data-quality-control        | Add a Data Quality & Control tab within the NicheAI Superadmin Dashboard.                                                          | archived    | [Link](openspec/changes/superadmin-data-quality-control)        |
| superadmin-feature-controls            | Provide an impersonation toggle to drop superadmin privileges temporarily.                                                         | archived    | [Link](openspec/changes/superadmin-feature-controls)            |
| sync-fallback                          | Implement a real-time synchronous fallback path and circuit breaker for unseeded hyper-niches.                                     | archived    | [Link](openspec/changes/sync-fallback)                          |
| system-logs-ux                         | Map internal AI and search tool names to generic action labels in the UI logs.                                                     | archived    | [Link](openspec/changes/system-logs-ux)                         |
| test-coverage-and-quality              | Addition of comprehensive test suites using Vitest, RTL, and MSW for new UI components.                                            | archived    | [Link](openspec/changes/test-coverage-and-quality)              |
| test-coverage-expansion                | Enforce an 80% test coverage threshold and implement robust integration tests.                                                     | implemented | [Link](openspec/changes/test-coverage-expansion)                |
| test-coverage-quality                  | Comprehensive intent-based test suites for recently modified files.                                                                | archived    | [Link](openspec/changes/test-coverage-quality)                  |
| tooltip-activation-fix                 | Ensure Sync Now tooltip correctly uses invisible and hover classes.                                                                | archived    | [Link](openspec/changes/tooltip-activation-fix)                 |
| unified-ideation-and-evolution         | Overhaul of initial onboarding into a Unified Ideation & Evolution Engine.                                                         | archived    | [Link](openspec/changes/unified-ideation-and-evolution)         |
| update-coverage-threshold-80           | Update enforced coverage threshold across repository documentation to 80%.                                                         | implemented | [Link](openspec/changes/update-coverage-threshold-80)           |
| url-onboarding-plg                     | Introduce a URL input intent and Express BFF endpoint using Gemini Flash-Lite for scraping.                                        | archived    | [Link](openspec/changes/url-onboarding-plg)                     |

<!-- OPENSPEC_TABLE_END -->

## 📈 Recent Momentum

<!-- GIT_HISTORY_START -->

- **feat**: Implement superadmin data quality dashboard & pipeline control circuit breaker
- **feat**: Enforce global quota and optimize tokens for anonymous plg teaser
- **feat**: Implement premium-teaser-fingerprinting via openspec
- **feat**: Implement idea-validation-plg-teaser via openspec
- **fix**: Prevent crash via optional chaining on admin.apps.length in workers
- **fix**: Wire up URL intent for onboarding tests in ZeroFrictionEntry
- **fix**: Prevent Uncaught TypeError on productDescription in ZeroFrictionEntry
- **test**: Increase test coverage to 100% for campaignRoutes
- **docs**: Extract continual learning lessons from plg teaser optimizations
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
