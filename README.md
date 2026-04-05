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

| Feature                                | Summary                                                                                                                              | Status      | Link                                                                                              |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------- |
| plg-builder-journey                    | No proposal found.                                                                                                                   | archived    | [plg-builder-journey](openspec/changes/plg-builder-journey)                                       |
| ai-model-fallback                      | We are introducing a unified AI client that wraps Gemini, OpenAI, and Anthropic SDKs.                                                | archived    | [ai-model-fallback](openspec/changes/ai-model-fallback)                                           |
| analytical-template-system             | Introduce a unified Analytical Template System that routes users into two distinct flows.                                            | archived    | [analytical-template-system](openspec/changes/analytical-template-system)                         |
| architecture-performance-optimization  | Extract heavy subcomponents from App.tsx into separate files and push volatile state down the component tree.                        | archived    | [architecture-performance-optimization](openspec/changes/architecture-performance-optimization)   |
| comprehensive-documentation-update     | Update in-app guides, tooltips, onboarding modals, and help pages to reflect the current feature set and UI changes.                 | archived    | [comprehensive-documentation-update](openspec/changes/comprehensive-documentation-update)         |
| consolidate-features-modal             | Retroactive documentation of the Consolidate Features Modal feature.                                                                 | archived    | [consolidate-features-modal](openspec/changes/consolidate-features-modal)                         |
| data-export-generator                  | Introduce a Comprehensive Data Export & Documentation Generator feature across the application.                                      | archived    | [data-export-generator](openspec/changes/data-export-generator)                                   |
| data-sync-review                       | Introduce a universal Data Sync Review workflow to act as a gatekeeper for all external data pulls.                                  | archived    | [data-sync-review](openspec/changes/data-sync-review)                                             |
| dev-workflow-and-cicd                  | Implementing lefthook for parallelized, high-performance local git hooks.                                                            | archived    | [dev-workflow-and-cicd](openspec/changes/dev-workflow-and-cicd)                                   |
| developer-onboarding-docs              | Our current developer documentation needs to be enhanced to ensure rapid onboarding.                                                 | proposed    | [developer-onboarding-docs](openspec/changes/developer-onboarding-docs)                           |
| documentation-wizard                   | Introduces the DocumentationWizardModal, allowing users to select features, next steps, and generate/download them.                  | archived    | [documentation-wizard](openspec/changes/documentation-wizard)                                     |
| feature-videos                         | We are transitioning the feature video generation pipeline from continuous Playwright recordings to an agent-browser setup.          | archived    | [feature-videos](openspec/changes/feature-videos)                                                 |
| gemini-model-upgrade-routing           | Complete removal of gemini-3-flash-preview and other legacy models, replacing them with the current state-of-the-art.                | archived    | [gemini-model-upgrade-routing](openspec/changes/gemini-model-upgrade-routing)                     |
| global-progress-banner                 | Introduces a GlobalProgressBanner component at the top of the application layout that listens to the global activeTasks array.       | archived    | [global-progress-banner](openspec/changes/global-progress-banner)                                 |
| head-to-head-comparison                | Introducing a Head-to-Head Comparison view.                                                                                          | archived    | [head-to-head-comparison](openspec/changes/head-to-head-comparison)                               |
| hitl-feature-merging                   | We are introducing a Human-in-the-Loop (HITL) merging system.                                                                        | archived    | [hitl-feature-merging](openspec/changes/hitl-feature-merging)                                     |
| hybrid-scoring-tarpit-flywheel         | We are replacing stochastic LLM vibes with a mathematically rigorous Hybrid Scoring Engine.                                          | archived    | [hybrid-scoring-tarpit-flywheel](openspec/changes/hybrid-scoring-tarpit-flywheel)                 |
| idea-validation-plg-teaser             | Route unauthenticated users to a teaser branch.                                                                                      | archived    | [idea-validation-plg-teaser](openspec/changes/idea-validation-plg-teaser)                         |
| inject-brand-identity-prompt           | Add a pure function to format and append the ProjectBrandIdentity.                                                                   | implemented | [inject-brand-identity-prompt](openspec/changes/inject-brand-identity-prompt)                     |
| insight-brainstorm-chat                | Retroactive documentation of the Insight Brainstorm Chat feature.                                                                    | archived    | [insight-brainstorm-chat](openspec/changes/insight-brainstorm-chat)                               |
| insight-generator-modal                | Retroactive documentation of the Insight Generator Modal feature.                                                                    | archived    | [insight-generator-modal](openspec/changes/insight-generator-modal)                               |
| insight-quest-modal                    | We are documenting the implementation of the InsightQuestModal, a gamified, Tinder-style A/B testing interface.                      | archived    | [insight-quest-modal](openspec/changes/insight-quest-modal)                                       |
| interactive-tour-guide                 | A custom, lightweight, React 19-compatible guided tour component powered by Framer Motion.                                           | archived    | [interactive-tour-guide](openspec/changes/interactive-tour-guide)                                 |
| market-analysis-features               | We are introducing a tabbed interface within the MarketAnalysis component to separate conversational AI from a robust Data Grid.     | archived    | [market-analysis-features](openspec/changes/market-analysis-features)                             |
| market-data-grid                       | Retroactive documentation of the Market Data Grid feature.                                                                           | archived    | [market-data-grid](openspec/changes/market-data-grid)                                             |
| market-value-notebook                  | Retroactive documentation of the Market Value Notebook feature.                                                                      | archived    | [market-value-notebook](openspec/changes/market-value-notebook)                                   |
| marketing-video-automation             | We are implementing Marketing Video Automation & Mock Data to streamline video generation.                                           | archived    | [marketing-video-automation](openspec/changes/marketing-video-automation)                         |
| multi-product-and-teams                | Enhancing the existing product dropdown in the top navigation to support adding new products.                                        | archived    | [multi-product-and-teams](openspec/changes/multi-product-and-teams)                               |
| multiple-visual-whiteboards            | Users can create, name, and switch between multiple infinite-canvas whiteboards.                                                     | archived    | [multiple-visual-whiteboards](openspec/changes/multiple-visual-whiteboards)                       |
| narrative-feature-videos               | We are upgrading scripts/generate_feature_videos.cjs to inject a highly-realistic, animated macOS-style SVG cursor.                  | archived    | [narrative-feature-videos](openspec/changes/narrative-feature-videos)                             |
| premium-teaser-fingerprinting          | Upgrade /api/scoring/stream endpoint to utilize gemini-3.1-pro-preview and exa.searchAndContents for anonymous users.                | archived    | [premium-teaser-fingerprinting](openspec/changes/premium-teaser-fingerprinting)                   |
| rapid-pdlc-prompt-exporter             | We are introducing a Rapid PDLC Workflow (Strategy to Code) feature.                                                                 | implemented | [rapid-pdlc-prompt-exporter](openspec/changes/rapid-pdlc-prompt-exporter)                         |
| raw-data-library                       | We are introducing a unified, multi-modal Raw Data Library backed by PostgreSQL.                                                     | archived    | [raw-data-library](openspec/changes/raw-data-library)                                             |
| remove-inspire-radio                   | Complete removal of the InspiringRadioWidget component and its associated tests.                                                     | archived    | [remove-inspire-radio](openspec/changes/remove-inspire-radio)                                     |
| test-coverage-expansion                | We are introducing a comprehensive suite of unit tests for the visual knowledge store and the new whiteboard UI components.          | archived    | [test-coverage-expansion](openspec/changes/test-coverage-expansion)                               |
| test-coverage-expansion-phase2         | We are introducing new unit and integration tests for various hooks, utility functions, and React components.                        | archived    | [test-coverage-expansion-phase2](openspec/changes/test-coverage-expansion-phase2)                 |
| test-coverage-tarpit-tollgate          | We will implement a non-brittle, comprehensive Boundary Testing Approach using Vitest, MSW, Supertest, and Playwright.               | archived    | [test-coverage-tarpit-tollgate](openspec/changes/test-coverage-tarpit-tollgate)                   |
| testing-architecture-modernization     | We are modernizing the testing architecture by shifting to the Testing Trophy methodology.                                           | archived    | [testing-architecture-modernization](openspec/changes/testing-architecture-modernization)         |
| ast-driven-drift-healing               | We will transform documentation drift detection into a proactive, self-healing Strategic Sprint Engine.                              | archived    | [ast-driven-drift-healing](openspec/changes/ast-driven-drift-healing)                             |
| atomic-staging-safeguards              | We are introducing Atomic Staging Safeguards to the OpenSpec CLI, specifically targeting the propose.ts command.                     | archived    | [atomic-staging-safeguards](openspec/changes/atomic-staging-safeguards)                           |
| bq-search-signals                      | Implement logic to execute native partitioned queries for GitHubArchive, Hacker News, and Chrome UX Report.                          | archived    | [bq-search-signals](openspec/changes/bq-search-signals)                                           |
| brand-positioning-wizard               | We are introducing a Brand Identity & Positioning Wizard.                                                                            | implemented | [brand-positioning-wizard](openspec/changes/brand-positioning-wizard)                             |
| bug-hunt-test-review                   | Implement rigorous testing standards across the repository.                                                                          | archived    | [bug-hunt-test-review](openspec/changes/bug-hunt-test-review)                                     |
| calibrated-transparent-ai              | We are implementing Calibrated Trust, a suite of five UX and Backend patterns.                                                       | archived    | [calibrated-transparent-ai](openspec/changes/calibrated-transparent-ai)                           |
| cloud-run-scale-to-zero                | Introduce a multi-stage Docker build transitioning to a distroless runtime environment.                                              | archived    | [cloud-run-scale-to-zero](openspec/changes/cloud-run-scale-to-zero)                               |
| cloud-tasks-local-simulator            | This OpenSpec will refactor the local development setup to ensure true offline/local operation.                                      | archived    | [cloud-tasks-local-simulator](openspec/changes/cloud-tasks-local-simulator)                       |
| cloudflare-deployment-analytics-engine | Currently, our application relies on mocked frontend and backend components, lacking a production-grade deployment.                  | archived    | [cloudflare-deployment-analytics-engine](openspec/changes/cloudflare-deployment-analytics-engine) |
| codebase-test-quality-review           | A comprehensive, structured review of the entire NicheAI codebase to discover latent bugs and improve test quality.                  | archived    | [codebase-test-quality-review](openspec/changes/codebase-test-quality-review)                     |
| competitor-discovery-frontend          | Update handleGlobalSync to intercept the empty competitors array condition.                                                          | completed   | [competitor-discovery-frontend](openspec/changes/competitor-discovery-frontend)                   |
| competitor-discovery-review            | This feature intercepts the deep validation trigger and introduces a synchronous Human-in-the-Loop (HITL) step.                      | implemented | [competitor-discovery-review](openspec/changes/competitor-discovery-review)                       |
| comprehensive-documentation            | A massive platform-wide overhaul of all documentation, user onboarding guides, and progressive disclosure patterns.                  | archived    | [comprehensive-documentation](openspec/changes/comprehensive-documentation)                       |
| comprehensive-test-coverage            | Introduces comprehensive, intent-based testing utilizing a combination of Vitest, React Testing Library, and MSW.                    | archived    | [comprehensive-test-coverage](openspec/changes/comprehensive-test-coverage)                       |
| deduplication-algorithm                | We are formalizing a Tri-Tiered Waterfall Matching Strategy to identify related raw data entries.                                    | archived    | [deduplication-algorithm](openspec/changes/deduplication-algorithm)                               |
| dummy-spec                             | No proposal found.                                                                                                                   | implemented | [dummy-spec](openspec/changes/dummy-spec)                                                         |
| dynamic-test-scaling                   | Introduces a dynamic, hardware-and-environment-aware resource allocation strategy for the test runner.                               | archived    | [dynamic-test-scaling](openspec/changes/dynamic-test-scaling)                                     |
| educational-tone-refactor              | The global CO-STAR User Rule will be refactored to incorporate the Anchor and Define pattern.                                        | implemented | [educational-tone-refactor](openspec/changes/educational-tone-refactor)                           |
| enterprise-ml-orchestration            | Semantic routing mapping tasks to model tiers using Multi-Armed Bandits for adaptive adjustments.                                    | archived    | [enterprise-ml-orchestration](openspec/changes/enterprise-ml-orchestration)                       |
| exa-api-key-fallback                   | We are introducing a secondary Exa API key to be used as a fallback in our code.                                                     | archived    | [exa-api-key-fallback](openspec/changes/exa-api-key-fallback)                                     |
| fetch-with-app-check-fix               | The getIdToken() call will be wrapped in a robust exponential backoff retry utility.                                                 | completed   | [fetch-with-app-check-fix](openspec/changes/fetch-with-app-check-fix)                             |
| global-anonymous-limits                | Add a global counter in Firestore that tracks total anonymous teaser runs.                                                           | superseded  | [global-anonymous-limits](openspec/changes/global-anonymous-limits)                               |
| hyper-scale-saas-data-moat-pipeline    | Replaces basic directories and Cloud SQL queues with a Serverless Extraction & LLM Synthesis (SELS) architecture.                    | archived    | [hyper-scale-saas-data-moat-pipeline](openspec/changes/hyper-scale-saas-data-moat-pipeline)       |
| ideation-workflow                      | We are introducing the Product Ideation & Niche Discovery Workflow, a radical overhaul of the onboarding experience.                 | superseded  | [ideation-workflow](openspec/changes/ideation-workflow)                                           |
| image-import                           | The UploadDataModal will be extended to accept image files.                                                                          | archived    | [image-import](openspec/changes/image-import)                                                     |
| intent-based-testing                   | We are rolling out an intent-based testing suite for all P0 features.                                                                | implemented | [intent-based-testing](openspec/changes/intent-based-testing)                                     |
| ml-orchestration-system                | Replaces static model routing with dynamically weighted, asynchronously updated model routing.                                       | implemented | [ml-orchestration-system](openspec/changes/ml-orchestration-system)                               |
| mlp-hands-on-review                    | We are conducting a comprehensive, hands-on product review spanning four key areas.                                                  | archived    | [mlp-hands-on-review](openspec/changes/mlp-hands-on-review)                                       |
| multi-category-mentions                | A real-time, multi-category autocomplete mention system will be introduced into the chat interface.                                  | archived    | [multi-category-mentions](openspec/changes/multi-category-mentions)                               |
| multi-product-workspace                | We are introducing a native WorkspaceProvider using React Context to manage the activeProductId.                                     | archived    | [multi-product-workspace](openspec/changes/multi-product-workspace)                               |
| mvp-analytics-superadmin               | Replace the over-engineered Recharts visualizations in SuperadminAnalytics.tsx with a Magic Login table.                             | archived    | [mvp-analytics-superadmin](openspec/changes/mvp-analytics-superadmin)                             |
| navbar-logical-ordering                | The sidebar navigation items will be reordered and grouped logically to reflect a workflow-based navigation pattern.                 | archived    | [navbar-logical-ordering](openspec/changes/navbar-logical-ordering)                               |
| next-gen-analytics                     | We are introducing the Next-Gen Analytics Platform.                                                                                  | archived    | [next-gen-analytics](openspec/changes/next-gen-analytics)                                         |
| niche-radar-plg-loop                   | NicheAI requires a high-converting Product-Led Growth (PLG) acquisition engine.                                                      | archived    | [niche-radar-plg-loop](openspec/changes/niche-radar-plg-loop)                                     |
| nicheai-ux-strategy                    | Implementation of Intent-Based Routing and Progressive Disclosure to reduce decision fatigue.                                        | implemented | [nicheai-ux-strategy](openspec/changes/nicheai-ux-strategy)                                       |
| openspec-agent-cli-upgrade             | The CLI will be refactored into a Dual-Mode tool, safely bridging human interactive operation with programmable agentic workflows.   | archived    | [openspec-agent-cli-upgrade](openspec/changes/openspec-agent-cli-upgrade)                         |
| openspec-continual-learning            | Introduce a formal Phase 2.5: Continual Learning & Extraction into the OpenSpec lifecycle.                                           | implemented | [openspec-continual-learning](openspec/changes/openspec-continual-learning)                       |
| openspec-documentation-unification     | Establish an 8-Step Lifecycle by explicitly adding the Validate phase.                                                               | implemented | [openspec-documentation-unification](openspec/changes/openspec-documentation-unification)         |
| openspec-intent-based-testing          | We are updating the custom OpenSpec workflow managed via .cursor/rules and .cursor/skills.                                           | implemented | [openspec-intent-based-testing](openspec/changes/openspec-intent-based-testing)                   |
| performance-optimization               | This change introduces aggressive code-splitting for large feature components and natively memoizes the React tree.                  | archived    | [performance-optimization](openspec/changes/performance-optimization)                             |
| plg-architecture-remediation           | Transition the global anonymous rate limit from Firestore to a Redis distributed counter via atomic INCR.                            | archived    | [plg-architecture-remediation](openspec/changes/plg-architecture-remediation)                     |
| plg-builder-journey                    | Context & Objective: NicheAI requires a highly visual, interactive PLG Builder Paradigm.                                             | archived    | [plg-builder-journey](openspec/changes/plg-builder-journey)                                       |
| plg-journey-optimization               | This OpenSpec overhauls the PLG-to-Workspace journey by stabilizing the streaming UI.                                                | archived    | [plg-journey-optimization](openspec/changes/plg-journey-optimization)                             |
| plg-reverse-demo-hook                  | This OpenSpec overhauls the PLG-to-Workspace journey by stabilizing the streaming UI.                                                | archived    | [plg-reverse-demo-hook](openspec/changes/plg-reverse-demo-hook)                                   |
| plg-teaser-idea-validation             | Route /api/scoring/stream to detect unauthenticated users.                                                                           | archived    | [plg-teaser-idea-validation](openspec/changes/plg-teaser-idea-validation)                         |
| plg-ux-bifurcation                     | We will explicitly bifurcate the User Experience (UX) and Information Architecture (IA) at the Zero Friction Entry.                  | archived    | [plg-ux-bifurcation](openspec/changes/plg-ux-bifurcation)                                         |
| pql-reverse-demo-trust-builder         | We are revamping the ideation flow to be a Trust-Building Progressive Disclosure journey.                                            | archived    | [pql-reverse-demo-trust-builder](openspec/changes/pql-reverse-demo-trust-builder)                 |
| pql-trust-builder                      | The ideation flow is being revamped into a Trust-Building Progressive Disclosure journey, culminating in a high-converting PQL gate. | archived    | [pql-trust-builder](openspec/changes/pql-trust-builder)                                           |
| proactive-market-analysis              | Introduce a progressive sync banner that displays real-time background task progress without blocking the chat.                      | archived    | [proactive-market-analysis](openspec/changes/proactive-market-analysis)                           |
| product-evolution-engine               | NicheAI will evolve from tracking a static My Product object into an Evolution Engine.                                               | superseded  | [product-evolution-engine](openspec/changes/product-evolution-engine)                             |
| raw-data-image-storage                 | We are introducing persistent cloud storage for user-uploaded images using Supabase Storage.                                         | archived    | [raw-data-image-storage](openspec/changes/raw-data-image-storage)                                 |
| react19-firebase-sync                  | Completely reject parallel get() fetches in favor of strictly relying on onSnapshot with built-in metadata.                          | completed   | [react19-firebase-sync](openspec/changes/react19-firebase-sync)                                   |
| reverse-demo-hook-plg                  | We will remove the initial AuthScreen and replace the multi-step onboarding with a single input.                                     | archived    | [reverse-demo-hook-plg](openspec/changes/reverse-demo-hook-plg)                                   |
| sanitize-system-logs                   | Hide the View Context Data and View Response Details sections in the System Logs UI for non-superadmin users.                        | archived    | [sanitize-system-logs](openspec/changes/sanitize-system-logs)                                     |
| scale-to-zero-deployment-docs          | The README.md will be updated with a comprehensive Scale-to-Zero Deployment Guide.                                                   | archived    | [scale-to-zero-deployment-docs](openspec/changes/scale-to-zero-deployment-docs)                   |
| smart-llm-routing                      | We are introducing an Auto (Smart Routing) mode as the default behavior.                                                             | archived    | [smart-llm-routing](openspec/changes/smart-llm-routing)                                           |
| strategy-toolbox                       | Replacing the static, rigid Analytical Template Library with a dynamic, data-driven Strategy Toolbox.                                | archived    | [strategy-toolbox](openspec/changes/strategy-toolbox)                                             |
| supabase-integration                   | Adding team_id to raw_data_assets, raw_data_versions, and raw_data_inbox.                                                            | archived    | [supabase-integration](openspec/changes/supabase-integration)                                     |
| superadmin-data-quality-control        | We will add a Data Quality & Control tab within the NicheAI Superadmin Dashboard.                                                    | archived    | [superadmin-data-quality-control](openspec/changes/superadmin-data-quality-control)               |
| superadmin-feature-controls            | A toggle in the Superadmin Dashboard to drop superadmin privileges temporarily for the current session.                              | archived    | [superadmin-feature-controls](openspec/changes/superadmin-feature-controls)                       |
| sync-fallback                          | Implement a synchronous fallback (Exa -> Gemini Flash) for unseeded hyper-niches.                                                    | archived    | [sync-fallback](openspec/changes/sync-fallback)                                                   |
| system-logs-ux                         | Map internal AI and search tool names to generic action labels in the UI.                                                            | archived    | [system-logs-ux](openspec/changes/system-logs-ux)                                                 |
| test-coverage-and-quality              | Addition of comprehensive test suites using Vitest, React Testing Library (RTL), and MSW for newly modified/added UI components.     | archived    | [test-coverage-and-quality](openspec/changes/test-coverage-and-quality)                           |
| test-coverage-expansion                | Enforce an 80% branch and intent-based test coverage threshold using Vitest.                                                         | implemented | [test-coverage-expansion](openspec/changes/test-coverage-expansion)                               |
| test-coverage-quality                  | Comprehensive test suites for recently modified/added files using Vitest, React Testing Library (RTL), and MSW.                      | archived    | [test-coverage-quality](openspec/changes/test-coverage-quality)                                   |
| tooltip-activation-fix                 | Update the wrapper for SyncNowButton to tightly fit the button.                                                                      | archived    | [tooltip-activation-fix](openspec/changes/tooltip-activation-fix)                                 |
| unified-ideation-and-evolution         | A complete overhaul of the initial onboarding and product ideation experience.                                                       | archived    | [unified-ideation-and-evolution](openspec/changes/unified-ideation-and-evolution)                 |
| update-coverage-threshold-80           | The enforced coverage threshold across the repository documentation, rules, and skills will be updated to 80%.                       | implemented | [update-coverage-threshold-80](openspec/changes/update-coverage-threshold-80)                     |
| url-onboarding-plg                     | Introduce a new intent/flow in ZeroFrictionEntry where users can input a URL.                                                        | archived    | [url-onboarding-plg](openspec/changes/url-onboarding-plg)                                         |

<!-- OPENSPEC_TABLE_END -->

## 📈 Recent Momentum

<!-- GIT_HISTORY_START -->

- **Refactor:** de-slop NodeGraphPipeline and enhance interaction states (b393453)
- **Refactor:** address design, pattern, and framework review feedback (f9b4776)
- **Refactor:** apply design and pattern specialist reviews, fix a11y and UX gaps (ec037f0)
- **Fix:** restore components to vitest coverage exclude to fix global threshold (e7b94bc)
- **Test:** ensure >95% coverage for recent plg builder components (4ccb3c7)
- **Feature:** added tests for NodeGraphPipeline (766b890)
- **Feature:** added tests and remaining components for plg builder (f851422)
- **Fix:** import vi in ConstraintEngine.test.tsx (819eafe)
- **Fix:** use vi.fn instead of vitest.fn (0043404)
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
