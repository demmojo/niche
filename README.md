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

| Feature                                  | Summary                                                                                                       | Status      | Link                                                            |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------- | --------------------------------------------------------------- |
| `plg-builder-journey`                    | No proposal found.                                                                                            | archived    | [View](openspec/changes/plg-builder-journey)                    |
| `ai-model-fallback`                      | We are introducing a unified AI client that wraps Gemini, OpenAI, and Anthropic SDKs.                         | archived    | [View](openspec/changes/ai-model-fallback)                      |
| `analytical-template-system`             | Introduce a unified Analytical Template System that routes users into two distinct flows.                     | archived    | [View](openspec/changes/analytical-template-system)             |
| `architecture-performance-optimization`  | Extract heavy subcomponents from App.tsx into separate files and push volatile state down the component tree. | archived    | [View](openspec/changes/architecture-performance-optimization)  |
| `comprehensive-documentation-update`     | Update in-app guides, tooltips, onboarding modals, and help pages to reflect the current feature set.         | archived    | [View](openspec/changes/comprehensive-documentation-update)     |
| `consolidate-features-modal`             | Retroactive documentation of the Consolidate Features Modal feature.                                          | archived    | [View](openspec/changes/consolidate-features-modal)             |
| `data-export-generator`                  | Introduce a Comprehensive Data Export & Documentation Generator feature across the application.               | archived    | [View](openspec/changes/data-export-generator)                  |
| `data-sync-review`                       | Introduce a universal Data Sync Review workflow to act as a gatekeeper for external data pulls.               | archived    | [View](openspec/changes/data-sync-review)                       |
| `dev-workflow-and-cicd`                  | Implement lefthook for parallelized, high-performance local git hooks.                                        | archived    | [View](openspec/changes/dev-workflow-and-cicd)                  |
| `developer-onboarding-docs`              | Enhance developer documentation to ensure smooth onboarding.                                                  | proposed    | [View](openspec/changes/developer-onboarding-docs)              |
| `documentation-wizard`                   | Introduces the DocumentationWizardModal for generating and exporting technical documents.                     | archived    | [View](openspec/changes/documentation-wizard)                   |
| `feature-videos`                         | Transition the feature video generation pipeline to an agent-browser snapshot approach.                       | archived    | [View](openspec/changes/feature-videos)                         |
| `gemini-model-upgrade-routing`           | Complete removal of legacy models, replacing them with state-of-the-art versions.                             | archived    | [View](openspec/changes/gemini-model-upgrade-routing)           |
| `global-progress-banner`                 | Introduces a GlobalProgressBanner component to display active background tasks.                               | archived    | [View](openspec/changes/global-progress-banner)                 |
| `head-to-head-comparison`                | Introducing a Head-to-Head Comparison view.                                                                   | archived    | [View](openspec/changes/head-to-head-comparison)                |
| `hitl-feature-merging`                   | We are introducing a Human-in-the-Loop (HITL) merging system.                                                 | archived    | [View](openspec/changes/hitl-feature-merging)                   |
| `hybrid-scoring-tarpit-flywheel`         | Replacing stochastic LLM vibes with a mathematically rigorous Hybrid Scoring Engine.                          | archived    | [View](openspec/changes/hybrid-scoring-tarpit-flywheel)         |
| `idea-validation-plg-teaser`             | Route unauthenticated users to a teaser branch with downgraded LLM and search capabilities.                   | archived    | [View](openspec/changes/idea-validation-plg-teaser)             |
| `inject-brand-identity-prompt`           | Add a pure function to format and append the ProjectBrandIdentity to AI generation payloads.                  | implemented | [View](openspec/changes/inject-brand-identity-prompt)           |
| `insight-brainstorm-chat`                | Retroactive documentation of the Insight Brainstorm Chat feature.                                             | archived    | [View](openspec/changes/insight-brainstorm-chat)                |
| `insight-generator-modal`                | Retroactive documentation of the Insight Generator Modal feature.                                             | archived    | [View](openspec/changes/insight-generator-modal)                |
| `insight-quest-modal`                    | Document the implementation of the InsightQuestModal, a gamified A/B testing interface.                       | archived    | [View](openspec/changes/insight-quest-modal)                    |
| `interactive-tour-guide`                 | A custom, lightweight, React 19-compatible guided tour component powered by Framer Motion.                    | archived    | [View](openspec/changes/interactive-tour-guide)                 |
| `market-analysis-features`               | Introduce a tabbed interface within the MarketAnalysis component.                                             | archived    | [View](openspec/changes/market-analysis-features)               |
| `market-data-grid`                       | Retroactive documentation of the Market Data Grid feature.                                                    | archived    | [View](openspec/changes/market-data-grid)                       |
| `market-value-notebook`                  | Retroactive documentation of the Market Value Notebook feature.                                               | archived    | [View](openspec/changes/market-value-notebook)                  |
| `marketing-video-automation`             | Implement Marketing Video Automation & Mock Data to streamline video generation.                              | archived    | [View](openspec/changes/marketing-video-automation)             |
| `multi-product-and-teams`                | Enhancing the product dropdown to support adding new products and teams.                                      | archived    | [View](openspec/changes/multi-product-and-teams)                |
| `multiple-visual-whiteboards`            | Users can create, name, and switch between multiple infinite-canvas whiteboards.                              | archived    | [View](openspec/changes/multiple-visual-whiteboards)            |
| `narrative-feature-videos`               | Upgrade video generation scripts to inject a realistic, animated macOS-style SVG cursor.                      | archived    | [View](openspec/changes/narrative-feature-videos)               |
| `premium-teaser-fingerprinting`          | Upgrade scoring endpoint to utilize gemini-3.1-pro-preview for anonymous users.                               | archived    | [View](openspec/changes/premium-teaser-fingerprinting)          |
| `rapid-pdlc-prompt-exporter`             | We are introducing a Rapid PDLC Workflow to export highly targeted code prompts.                              | implemented | [View](openspec/changes/rapid-pdlc-prompt-exporter)             |
| `raw-data-library`                       | Introduce a unified, multi-modal Raw Data Library backed by PostgreSQL.                                       | archived    | [View](openspec/changes/raw-data-library)                       |
| `remove-inspire-radio`                   | Complete removal of the InspiringRadioWidget component and its tests.                                         | archived    | [View](openspec/changes/remove-inspire-radio)                   |
| `test-coverage-expansion`                | Enforce an 80% branch and intent-based test coverage threshold using Vitest.                                  | implemented | [View](openspec/changes/test-coverage-expansion)                |
| `test-coverage-expansion-phase2`         | Introduce new unit and integration tests for hooks, utility functions, and React components.                  | archived    | [View](openspec/changes/test-coverage-expansion-phase2)         |
| `test-coverage-tarpit-tollgate`          | Implement a non-brittle, comprehensive Boundary Testing Approach using Vitest and MSW.                        | archived    | [View](openspec/changes/test-coverage-tarpit-tollgate)          |
| `testing-architecture-modernization`     | Modernizing the testing architecture by shifting to the Testing Trophy methodology.                           | archived    | [View](openspec/changes/testing-architecture-modernization)     |
| `ast-driven-drift-healing`               | Transform documentation drift detection into a proactive, self-healing Strategic Sprint Engine.               | archived    | [View](openspec/changes/ast-driven-drift-healing)               |
| `atomic-staging-safeguards`              | Introduce Atomic Staging Safeguards to the OpenSpec CLI propose command.                                      | archived    | [View](openspec/changes/atomic-staging-safeguards)              |
| `bq-search-signals`                      | Implement native partitioned queries for various datasets enforcing strict limits.                            | archived    | [View](openspec/changes/bq-search-signals)                      |
| `brand-positioning-wizard`               | Introduce a Brand Identity & Positioning Wizard to parse competitor sites.                                    | implemented | [View](openspec/changes/brand-positioning-wizard)               |
| `bug-hunt-test-review`                   | Conduct a thorough bug hunt and enforce rigorous testing standards across the repository.                     | archived    | [View](openspec/changes/bug-hunt-test-review)                   |
| `calibrated-transparent-ai`              | Implement Calibrated Trust UX via verifiable zero-retention receipts and logs.                                | archived    | [View](openspec/changes/calibrated-transparent-ai)              |
| `cloud-run-scale-to-zero`                | Introduce a multi-stage Docker build transitioning to a distroless runtime environment.                       | archived    | [View](openspec/changes/cloud-run-scale-to-zero)                |
| `cloud-tasks-local-simulator`            | Refactor the local development setup to ensure true offline/local operation.                                  | archived    | [View](openspec/changes/cloud-tasks-local-simulator)            |
| `cloudflare-deployment-analytics-engine` | Resolve the lack of a production-grade deployment and analytics infrastructure.                               | archived    | [View](openspec/changes/cloudflare-deployment-analytics-engine) |
| `codebase-test-quality-review`           | Comprehensive structured review of the entire codebase to discover latent bugs and improve tests.             | archived    | [View](openspec/changes/codebase-test-quality-review)           |
| `competitor-discovery-frontend`          | Update handleGlobalSync to show an explainable loading state when competitors array is empty.                 | completed   | [View](openspec/changes/competitor-discovery-frontend)          |
| `competitor-discovery-review`            | Intercept the validation trigger to introduce a synchronous Human-in-the-Loop Curation step.                  | implemented | [View](openspec/changes/competitor-discovery-review)            |
| `comprehensive-documentation`            | Platform-wide overhaul of all documentation, user onboarding guides, and progressive disclosure patterns.     | archived    | [View](openspec/changes/comprehensive-documentation)            |
| `comprehensive-test-coverage`            | Introduces comprehensive, intent-based testing utilizing Vitest, RTL, and MSW.                                | archived    | [View](openspec/changes/comprehensive-test-coverage)            |
| `deduplication-algorithm`                | Formalizing a Tri-Tiered Waterfall Matching Strategy to identify related raw data.                            | archived    | [View](openspec/changes/deduplication-algorithm)                |
| `dummy-spec`                             | No proposal found.                                                                                            | implemented | [View](openspec/changes/dummy-spec)                             |
| `dynamic-test-scaling`                   | Introduces a dynamic, hardware-and-environment-aware resource allocation strategy for the test runner.        | archived    | [View](openspec/changes/dynamic-test-scaling)                   |
| `educational-tone-refactor`              | Refactor the global CO-STAR User Rule to incorporate anchor patterns and complexity scaling.                  | implemented | [View](openspec/changes/educational-tone-refactor)              |
| `enterprise-ml-orchestration`            | Semantic routing mapping tasks to model tiers using Multi-Armed Bandits for adaptive task execution.          | archived    | [View](openspec/changes/enterprise-ml-orchestration)            |
| `exa-api-key-fallback`                   | Introduce a secondary Exa API key to be used as a fallback.                                                   | archived    | [View](openspec/changes/exa-api-key-fallback)                   |
| `fetch-with-app-check-fix`               | Wrap getIdToken calls in a robust exponential backoff retry utility.                                          | completed   | [View](openspec/changes/fetch-with-app-check-fix)               |
| `global-anonymous-limits`                | Add a global circuit breaker in Firestore to track total anonymous teaser runs.                               | superseded  | [View](openspec/changes/global-anonymous-limits)                |
| `hyper-scale-saas-data-moat-pipeline`    | Replaces basic directories with a Serverless Extraction & LLM Synthesis architecture.                         | archived    | [View](openspec/changes/hyper-scale-saas-data-moat-pipeline)    |
| `ideation-workflow`                      | Introduce the Product Ideation & Niche Discovery Workflow to overhaul onboarding.                             | superseded  | [View](openspec/changes/ideation-workflow)                      |
| `image-import`                           | Extend UploadDataModal to accept image files via paste or upload.                                             | archived    | [View](openspec/changes/image-import)                           |
| `intent-based-testing`                   | Roll out an intent-based testing suite for all P0 features like Tarpit Flywheel.                              | implemented | [View](openspec/changes/intent-based-testing)                   |
| `ml-orchestration-system`                | Replace static model routing with dynamically weighted queues via Multi-Armed Bandits.                        | implemented | [View](openspec/changes/ml-orchestration-system)                |
| `mlp-hands-on-review`                    | Conduct a comprehensive, hands-on product review spanning four key areas.                                     | archived    | [View](openspec/changes/mlp-hands-on-review)                    |
| `multi-category-mentions`                | Introduce a real-time, multi-category autocomplete mention system to the chat interface.                      | archived    | [View](openspec/changes/multi-category-mentions)                |
| `multi-product-workspace`                | Introduce a native WorkspaceProvider using React Context to manage active products.                           | archived    | [View](openspec/changes/multi-product-workspace)                |
| `mvp-analytics-superadmin`               | Replace Recharts visualizations with an impersonation table and simple reporting.                             | archived    | [View](openspec/changes/mvp-analytics-superadmin)               |
| `navbar-logical-ordering`                | Reorder sidebar navigation items logically to reflect a workflow-based navigation pattern.                    | archived    | [View](openspec/changes/navbar-logical-ordering)                |
| `next-gen-analytics`                     | Introduce the Next-Gen Analytics Platform featuring a Triple-Mode Smart Compose reporting canvas.             | archived    | [View](openspec/changes/next-gen-analytics)                     |
| `niche-radar-plg-loop`                   | Leverage a Reverse Demo model to deliver upfront value without authentication.                                | archived    | [View](openspec/changes/niche-radar-plg-loop)                   |
| `nicheai-ux-strategy`                    | Implementation of Intent-Based Routing and Progressive Disclosure to reduce decision fatigue.                 | implemented | [View](openspec/changes/nicheai-ux-strategy)                    |
| `openspec-agent-cli-upgrade`             | Refactor the CLI into a Dual-Mode tool bridging human operation with agentic workflows.                       | archived    | [View](openspec/changes/openspec-agent-cli-upgrade)             |
| `openspec-continual-learning`            | Introduce a formal Continual Learning & Extraction phase into the OpenSpec lifecycle.                         | implemented | [View](openspec/changes/openspec-continual-learning)            |
| `openspec-documentation-unification`     | Establish an 8-Step Lifecycle by explicitly adding the Validate phase.                                        | implemented | [View](openspec/changes/openspec-documentation-unification)     |
| `openspec-intent-based-testing`          | Update custom OpenSpec workflows to strictly require intent-based testing.                                    | implemented | [View](openspec/changes/openspec-intent-based-testing)          |
| `performance-optimization`               | Introduce aggressive code-splitting for large feature components to improve performance.                      | archived    | [View](openspec/changes/performance-optimization)               |
| `plg-architecture-remediation`           | Transition the global anonymous rate limit to a Redis distributed counter via atomic INCR.                    | archived    | [View](openspec/changes/plg-architecture-remediation)           |
| `plg-builder-journey`                    | PLG Builder Paradigm Journey UI updates and architectural fixes.                                              | archived    | [View](openspec/changes/plg-builder-journey)                    |
| `plg-journey-optimization`               | Stabilize the streaming UI and ensure seamless state hydration across the auth boundary.                      | archived    | [View](openspec/changes/plg-journey-optimization)               |
| `plg-reverse-demo-hook`                  | Overhaul the PLG-to-Workspace journey by stabilizing streaming UI and authenticating inputs.                  | archived    | [View](openspec/changes/plg-reverse-demo-hook)                  |
| `plg-teaser-idea-validation`             | Route streaming endpoints to detect unauthenticated users and adjust remote configs.                          | archived    | [View](openspec/changes/plg-teaser-idea-validation)             |
| `plg-ux-bifurcation`                     | Explicitly bifurcate the User Experience and Information Architecture at the Zero Friction Entry.             | archived    | [View](openspec/changes/plg-ux-bifurcation)                     |
| `pql-reverse-demo-trust-builder`         | Revamp the ideation flow to be a Trust-Building Progressive Disclosure journey.                               | archived    | [View](openspec/changes/pql-reverse-demo-trust-builder)         |
| `pql-trust-builder`                      | Revamp the ideation flow to be a Trust-Building journey culminating in a high-converting PQL gate.            | archived    | [View](openspec/changes/pql-trust-builder)                      |
| `proactive-market-analysis`              | Introduce a progressive sync banner that displays real-time background task progress.                         | archived    | [View](openspec/changes/proactive-market-analysis)              |
| `product-evolution-engine`               | Evolve from tracking static products to an Evolution Engine ingesting multiple states.                        | superseded  | [View](openspec/changes/product-evolution-engine)               |
| `raw-data-image-storage`                 | Introduce persistent cloud storage for user-uploaded images using Supabase Storage.                           | archived    | [View](openspec/changes/raw-data-image-storage)                 |
| `react19-firebase-sync`                  | Adopt a Snapshot-Only approach for Firebase queries, eliminating manual GET fetches.                          | completed   | [View](openspec/changes/react19-firebase-sync)                  |
| `reverse-demo-hook-plg`                  | Remove the initial AuthScreen and replace onboarding with a single friction-free input.                       | archived    | [View](openspec/changes/reverse-demo-hook-plg)                  |
| `sanitize-system-logs`                   | Hide sensitive context data and sanitize log messages for non-superadmin users in the System Logs UI.         | archived    | [View](openspec/changes/sanitize-system-logs)                   |
| `scale-to-zero-deployment-docs`          | Update the README with a comprehensive Scale-to-Zero Deployment Guide.                                        | archived    | [View](openspec/changes/scale-to-zero-deployment-docs)          |
| `smart-llm-routing`                      | Introduce an Auto (Smart Routing) mode as the default generative AI behavior.                                 | archived    | [View](openspec/changes/smart-llm-routing)                      |
| `strategy-toolbox`                       | Replacing the static Analytical Template Library with a dynamic Strategy Toolbox.                             | archived    | [View](openspec/changes/strategy-toolbox)                       |
| `supabase-integration`                   | Integrate Multi-tenancy to tables and update Supabase Client settings.                                        | archived    | [View](openspec/changes/supabase-integration)                   |
| `superadmin-data-quality-control`        | Add a Data Quality & Control tab within the NicheAI Superadmin Dashboard.                                     | archived    | [View](openspec/changes/superadmin-data-quality-control)        |
| `superadmin-feature-controls`            | Introduce a View-As toggle in the Dashboard to easily impersonate end-users.                                  | archived    | [View](openspec/changes/superadmin-feature-controls)            |
| `sync-fallback`                          | Implement a synchronous fallback path and circuit breaker for unseeded hyper-niches.                          | archived    | [View](openspec/changes/sync-fallback)                          |
| `system-logs-ux`                         | Map internal AI and search tool names to generic action labels in the UI.                                     | archived    | [View](openspec/changes/system-logs-ux)                         |
| `test-coverage-and-quality`              | Addition of comprehensive test suites using Vitest, React Testing Library, and MSW.                           | archived    | [View](openspec/changes/test-coverage-and-quality)              |
| `test-coverage-quality`                  | Add comprehensive test suites for recently modified files.                                                    | archived    | [View](openspec/changes/test-coverage-quality)                  |
| `tooltip-activation-fix`                 | Update the SyncNowButton wrapper to correctly handle hover events and invisible classes.                      | archived    | [View](openspec/changes/tooltip-activation-fix)                 |
| `unified-ideation-and-evolution`         | A complete overhaul of the initial onboarding to become the Unified Ideation & Evolution Engine.              | archived    | [View](openspec/changes/unified-ideation-and-evolution)         |
| `update-coverage-threshold-80`           | Ensure the required test coverage threshold across the repository remains 80%.                                | implemented | [View](openspec/changes/update-coverage-threshold-80)           |
| `url-onboarding-plg`                     | Introduce a new flow in ZeroFrictionEntry where users can input a URL for analysis.                           | archived    | [View](openspec/changes/url-onboarding-plg)                     |

<!-- OPENSPEC_TABLE_END -->

## 📈 Recent Momentum

<!-- GIT_HISTORY_START -->

- **fix**: fix test failures for PLG Builder Journey (5d7f33d)
- **refactor**: address product strategy critique in ZeroFrictionEntry (a8b2114)
- **refactor**: de-slop NodeGraphPipeline and enhance interaction states (b393453)
- **refactor**: address design, pattern, and framework review feedback (f9b4776)
- **refactor**: apply design and pattern specialist reviews, fix a11y and UX gaps (ec037f0)
- **fix**: restore components to vitest coverage exclude to fix global threshold (e7b94bc)
- **test**: ensure >95% coverage for recent plg builder components (4ccb3c7)
- **feat**: added tests for NodeGraphPipeline (766b890)
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
