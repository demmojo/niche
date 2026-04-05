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

| Feature                                | Summary                                                                                                                                                     | Status      | Link                                                            |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | --------------------------------------------------------------- |
| ai-model-fallback                      | We are introducing a unified AI client that wraps Gemini, OpenAI, and Anthropic SDKs. We will allow users to input their own keys for ChatGPT (OpenAI)...   | archived    | [Link](openspec/changes/ai-model-fallback)                      |
| analytical-template-system             | Introduce a unified **Analytical Template System** that routes users into two distinct flows: 1. **Presentation Templates**: Read-optimized, high-den...    | archived    | [Link](openspec/changes/analytical-template-system)             |
| architecture-performance-optimization  | - **Deconstruct Monolith**: Extract heavy subcomponents from `App.tsx` into separate files and push volatile state (like chat inputs) down the compone...   | archived    | [Link](openspec/changes/architecture-performance-optimization)  |
| comprehensive-documentation-update     | - **In-App Documentation Update**: Update in-app guides, tooltips, onboarding modals, and help pages to reflect the current feature set and UI changes...   | archived    | [Link](openspec/changes/comprehensive-documentation-update)     |
| consolidate-features-modal             | Retroactive documentation of the Consolidate Features Modal feature....                                                                                     | archived    | [Link](openspec/changes/consolidate-features-modal)             |
| data-export-generator                  | Introduce a "Comprehensive Data Export & Documentation Generator" feature across the application. - **Universal Export Buttons**: Add clear "Export" ...    | archived    | [Link](openspec/changes/data-export-generator)                  |
| data-sync-review                       | Introduce a universal "Data Sync Review" workflow to act as a gatekeeper for all external data pulls and AI-generated state updates, along with compre...   | archived    | [Link](openspec/changes/data-sync-review)                       |
| dev-workflow-and-cicd                  | 1. **Lefthook over Husky:** Implementing `lefthook` for parallelized, high-performance local git hooks. 2. **Pre-commit Test Hooks:** Selectively runn...   | archived    | [Link](openspec/changes/dev-workflow-and-cicd)                  |
| developer-onboarding-docs              | # Proposal: Developer Onboarding Docs Update ## 1. Context and Problem Statement Our current developer documentation needs to be enhanced to ensure ...     | proposed    | [Link](openspec/changes/developer-onboarding-docs)              |
| documentation-wizard                   | Introduces the DocumentationWizardModal, allowing users to select features, next steps, and insights, choose an export format, and generate/download t...   | archived    | [Link](openspec/changes/documentation-wizard)                   |
| feature-videos                         | We are transitioning the feature video generation pipeline from continuous Playwright `WebM` recordings to an `agent-browser` (or Playwright screensho...   | archived    | [Link](openspec/changes/feature-videos)                         |
| gemini-model-upgrade-routing           | 1. **Model Audit & Replacement**: Complete removal of `gemini-3-flash-preview` and other legacy models, replacing them with the current state-of-the-a...   | archived    | [Link](openspec/changes/gemini-model-upgrade-routing)           |
| global-progress-banner                 | Introduces a `GlobalProgressBanner` component at the top of the application layout that listens to the global `activeTasks` array, displaying the acti...   | archived    | [Link](openspec/changes/global-progress-banner)                 |
| head-to-head-comparison                | Introducing a Head-to-Head Comparison view. - Updates to the Data Points Table to allow selecting up to 2 competitors. - Updates to the main App stat...    | archived    | [Link](openspec/changes/head-to-head-comparison)                |
| hitl-feature-merging                   | We are introducing a Human-in-the-Loop (HITL) merging system. Users can select multiple similar competitor features and merge them into a new feature ...   | archived    | [Link](openspec/changes/hitl-feature-merging)                   |
| hybrid-scoring-tarpit-flywheel         | We are replacing stochastic LLM "vibes" with a mathematically rigorous Hybrid Scoring Engine. 1. **Deterministic Scoring**: An LLM structurally parse...    | archived    | [Link](openspec/changes/hybrid-scoring-tarpit-flywheel)         |
| idea-validation-plg-teaser             | - **Backend**: Route unauthenticated users to a teaser branch. Downgrade LLM to `gemini-3.1-flash-lite-preview` and Exa search to `exa.search`. Implem...   | archived    | [Link](openspec/changes/idea-validation-plg-teaser)             |
| inject-brand-identity-prompt           | 1. Add a pure function (`promptAssembler.ts`) to format and append the `ProjectBrandIdentity` (hex colors converted to HSL, typography, and personalit...   | implemented | [Link](openspec/changes/inject-brand-identity-prompt)           |
| insight-brainstorm-chat                | Retroactive documentation of the Insight Brainstorm Chat feature....                                                                                        | archived    | [Link](openspec/changes/insight-brainstorm-chat)                |
| insight-generator-modal                | Retroactive documentation of the Insight Generator Modal feature....                                                                                        | archived    | [Link](openspec/changes/insight-generator-modal)                |
| insight-quest-modal                    | We are documenting the implementation of the `InsightQuestModal`, a gamified, Tinder-style A/B testing interface wrapped in a whimsical "farming" meta...   | archived    | [Link](openspec/changes/insight-quest-modal)                    |
| interactive-tour-guide                 | 1. **Interactive Tour Engine**: A custom, lightweight, React 19-compatible guided tour component powered by Framer Motion. 2. \*\*Whiteboard Onboarding ... | archived    | [Link](openspec/changes/interactive-tour-guide)                 |
| market-analysis-features               | We are introducing a tabbed interface within the `MarketAnalysis` component to separate the conversational AI ("Archivist Burt") from a new, robust "D...   | archived    | [Link](openspec/changes/market-analysis-features)               |
| market-data-grid                       | Retroactive documentation of the Market Data Grid feature....                                                                                               | archived    | [Link](openspec/changes/market-data-grid)                       |
| market-value-notebook                  | Retroactive documentation of the Market Value Notebook feature....                                                                                          | archived    | [Link](openspec/changes/market-value-notebook)                  |
| marketing-video-automation             | We are implementing "Marketing Video Automation & Mock Data" to streamline video generation. We will focus on the 5 most impactful features and genera...   | archived    | [Link](openspec/changes/marketing-video-automation)             |
| multi-product-and-teams                | - Enhancing the existing product dropdown in the top navigation to support adding new products. - Adding a new "Team" tab to the Settings area for use...   | archived    | [Link](openspec/changes/multi-product-and-teams)                |
| multiple-visual-whiteboards            | 1. **Multiple Whiteboards:** Users can create, name, and switch between multiple infinite-canvas whiteboards. 2. **Template Library:** Introduce 10 wh...   | archived    | [Link](openspec/changes/multiple-visual-whiteboards)            |
| narrative-feature-videos               | We are upgrading `scripts/generate_feature_videos.cjs` to inject a highly-realistic, animated macOS-style SVG cursor. We will rewrite the script for t...   | archived    | [Link](openspec/changes/narrative-feature-videos)               |
| premium-teaser-fingerprinting          | 1. Upgrade `/api/scoring/stream` endpoint to utilize `gemini-3.1-pro-preview` and `exa.searchAndContents` for anonymous users. 2. Implement `generateA...   | archived    | [Link](openspec/changes/premium-teaser-fingerprinting)          |
| rapid-pdlc-prompt-exporter             | We are introducing a **Rapid PDLC Workflow (Strategy to Code)** feature. This consists of: 1. A zero-cost, client-side **Prompt Assembler** that pack...    | implemented | [Link](openspec/changes/rapid-pdlc-prompt-exporter)             |
| raw-data-library                       | We are introducing a unified, multi-modal "Raw Data Library" backed by PostgreSQL. This library will handle structured, semi-structured, and unstructu...   | archived    | [Link](openspec/changes/raw-data-library)                       |
| remove-inspire-radio                   | - Complete removal of the `<InspiringRadioWidget />` component and its associated tests. - Removal of the widget's invocation from the main navigation...   | archived    | [Link](openspec/changes/remove-inspire-radio)                   |
| test-coverage-expansion                | - Enforce an 80% branch and intent-based test coverage threshold using Vitest (`v8` provider). - Implement robust, isolated integration tests directly...   | archived    | [Link](openspec/changes/test-coverage-expansion)                |
| test-coverage-expansion-phase2         | We are introducing new unit and integration tests for various hooks, utility functions, and React components. We are also refining existing tests to r...   | archived    | [Link](openspec/changes/test-coverage-expansion-phase2)         |
| test-coverage-tarpit-tollgate          | We will implement a non-brittle, comprehensive Boundary Testing Approach using Vitest, MSW (Mock Service Worker), Supertest, and Playwright. The focus...   | archived    | [Link](openspec/changes/test-coverage-tarpit-tollgate)          |
| testing-architecture-modernization     | We are modernizing the testing architecture by shifting to the "Testing Trophy" methodology. This involves: 1. Transitioning from heavily mocked unit...    | archived    | [Link](openspec/changes/testing-architecture-modernization)     |
| ast-driven-drift-healing               | We will transform documentation drift detection into a proactive, self-healing **Strategic Sprint Engine**. By upgrading from raw git text diffs to Ab...   | archived    | [Link](openspec/changes/ast-driven-drift-healing)               |
| atomic-staging-safeguards              | We are introducing Atomic Staging Safeguards to the OpenSpec CLI, specifically targeting the `propose.ts` command. 1. \*\*Interactive Overwrite Warning...  | archived    | [Link](openspec/changes/atomic-staging-safeguards)              |
| bq-search-signals                      | 1. **BigQuery Queries**: Implement logic to execute native partitioned queries for `githubarchive`, `hacker_news`, and `chrome-ux-report`, enforcing s...   | archived    | [Link](openspec/changes/bq-search-signals)                      |
| brand-positioning-wizard               | We are introducing a Brand Identity & Positioning Wizard. This feature will scrape 3-5 competitor URLs, parse their visual and tonal identities using ...   | implemented | [Link](openspec/changes/brand-positioning-wizard)               |
| bug-hunt-test-review                   | Implement rigorous testing standards across the repository. We will conduct a thorough bug hunt, resolve identified issues, and add missing unit and i...   | archived    | [Link](openspec/changes/bug-hunt-test-review)                   |
| calibrated-transparent-ai              | We are implementing "Calibrated Trust"—a suite of five UX and Backend patterns: 1. Cryptographically Verifiable Zero Data Retention (ZDR) Receipts. 2...    | archived    | [Link](openspec/changes/calibrated-transparent-ai)              |
| cloud-run-scale-to-zero                | 1. **Containerization**: Introduce a multi-stage Docker build transitioning to a distroless runtime environment. 2. **Infrastructure as Code**: Provis...   | archived    | [Link](openspec/changes/cloud-run-scale-to-zero)                |
| cloud-tasks-local-simulator            | This OpenSpec will refactor the local development setup to ensure true offline/local operation: 1. **Firebase Emulator Suite Integration:** Introduc...     | archived    | [Link](openspec/changes/cloud-tasks-local-simulator)            |
| cloudflare-deployment-analytics-engine | ### Why\nCurrently, our application relies on mocked frontend and backend components, lacking a production-grade deployment and analytics infrastructu...   | archived    | [Link](openspec/changes/cloudflare-deployment-analytics-engine) |
| codebase-test-quality-review           | A comprehensive, structured review of the entire NicheAI codebase to discover latent bugs, improve test quality, and ensure system robustness. This in...   | archived    | [Link](openspec/changes/codebase-test-quality-review)           |
| competitor-discovery-frontend          | - **Frontend (`src/App.tsx`)**: Update `handleGlobalSync` to intercept the empty `competitors` array condition. Show an explainable loading state and ...   | completed   | [Link](openspec/changes/competitor-discovery-frontend)          |
| competitor-discovery-review            | This feature intercepts the deep validation trigger and introduces a synchronous Human-in-the-Loop (HITL) Competitor Curation step. It discovers compe...   | implemented | [Link](openspec/changes/competitor-discovery-review)            |
| comprehensive-documentation            | A massive platform-wide overhaul of all documentation, user onboarding guides, and progressive disclosure patterns (tooltips). We are standardizing al...   | archived    | [Link](openspec/changes/comprehensive-documentation)            |
| comprehensive-test-coverage            | Introduces comprehensive, intent-based testing utilizing a combination of `Vitest`, `React Testing Library`, `MSW` for network mocking, and `Firebase-...   | archived    | [Link](openspec/changes/comprehensive-test-coverage)            |
| deduplication-algorithm                | We are formalizing a Tri-Tiered Waterfall Matching Strategy (Exact Match, Perceptual/Lexical Match, and Semantic Match) to identify related raw data i...   | archived    | [Link](openspec/changes/deduplication-algorithm)                |
| dummy-spec                             | No proposal found.                                                                                                                                          | implemented | [Link](openspec/changes/dummy-spec)                             |
| dynamic-test-scaling                   | Introduces a dynamic, hardware-and-environment-aware resource allocation strategy for the test runner. The configuration (`vitest.config.ts`, `vitest...    | archived    | [Link](openspec/changes/dynamic-test-scaling)                   |
| educational-tone-refactor              | The global CO-STAR User Rule will be refactored to incorporate: 1. The "Anchor and Define" pattern. 2. Complexity scaling for AI explanations. 3. Exp...    | implemented | [Link](openspec/changes/educational-tone-refactor)              |
| enterprise-ml-orchestration            | 1. **Capability-Driven Smart Routing:** Semantic routing mapping tasks to model tiers (Lite, Fast, Pro) using Multi-Armed Bandits (MAB) for adaptive t...   | archived    | [Link](openspec/changes/enterprise-ml-orchestration)            |
| exa-api-key-fallback                   | We are introducing a secondary Exa API key to be used as a fallback in our code. The priority for API keys will now be: 1. User's custom API key (via...    | archived    | [Link](openspec/changes/exa-api-key-fallback)                   |
| fetch-with-app-check-fix               | The `getIdToken()` call will be wrapped in a robust exponential backoff retry utility rather than relying on the undocumented and unreliable `(auth.cu...   | completed   | [Link](openspec/changes/fetch-with-app-check-fix)               |
| global-anonymous-limits                | - **Global Circuit Breaker**: Add a global counter in Firestore (`system_limits/anonymous_daily_{YYYY-MM-DD}`) that tracks total anonymous teaser runs...   | superseded  | [Link](openspec/changes/global-anonymous-limits)                |
| hyper-scale-saas-data-moat-pipeline    | Replaces basic directories and Cloud SQL queues with a **Serverless Extraction & LLM Synthesis (SELS)** architecture. It introduces a \*\*Synthetic Sign... | archived    | [Link](openspec/changes/hyper-scale-saas-data-moat-pipeline)    |
| ideation-workflow                      | We are introducing the **Product Ideation & Niche Discovery Workflow**, a radical overhaul of the onboarding and product definition experience. It re...    | superseded  | [Link](openspec/changes/ideation-workflow)                      |
| image-import                           | The `UploadDataModal` will be extended to accept image files (`.jpg`, `.jpeg`, `.png`, `.webp`). Users will be able to paste images directly from thei...   | archived    | [Link](openspec/changes/image-import)                           |
| intent-based-testing                   | We are rolling out an intent-based testing suite for all P0 features: Tarpit Flywheel, Market Intelligence, and Validation Arena. The initiative inclu...   | implemented | [Link](openspec/changes/intent-based-testing)                   |
| ml-orchestration-system                | 1. **Contextual Queueing Bandits (CQB)**: Replaces static model routing with dynamically weighted, asynchronously updated model routing (Lite, Fast, P...   | implemented | [Link](openspec/changes/ml-orchestration-system)                |
| mlp-hands-on-review                    | We are conducting a comprehensive, hands-on product review spanning four key areas: 1. **Anonymous / PLG Flow (The Hook):** Security and anti-abuse m...    | archived    | [Link](openspec/changes/mlp-hands-on-review)                    |
| multi-category-mentions                | A real-time, multi-category autocomplete mention system will be introduced into the chat interface using Tiptap for the rich-text editor and a Supabas...   | archived    | [Link](openspec/changes/multi-category-mentions)                |
| multi-product-workspace                | We are introducing a native `<WorkspaceProvider>` using React Context to manage the `activeProductId` and the user's list of products. We are also ext...   | archived    | [Link](openspec/changes/multi-product-workspace)                |
| mvp-analytics-superadmin               | 1. Replace the over-engineered Recharts visualizations in `SuperadminAnalytics.tsx` with a Magic Login (user impersonation) table and a daily Generati...   | archived    | [Link](openspec/changes/mvp-analytics-superadmin)               |
| navbar-logical-ordering                | The sidebar navigation items will be reordered and grouped logically to reflect a workflow-based navigation pattern: Observe -> Analyze -> Act -> Conf...   | archived    | [Link](openspec/changes/navbar-logical-ordering)                |
| next-gen-analytics                     | We are introducing the **Next-Gen Analytics Platform**. This replaces static data views with a dynamic, "Triple-Mode Smart Compose" reporting canvas b...   | archived    | [Link](openspec/changes/next-gen-analytics)                     |
| niche-radar-plg-loop                   | # Proposal\n\n## Why\nNicheAI requires a high-converting Product-Led Growth (PLG) acquisition engine. By leveraging a 'Reverse Demo' model, we can del...   | archived    | [Link](openspec/changes/niche-radar-plg-loop)                   |
| nicheai-ux-strategy                    | - **Evidence-Based Onboarding**: Implementation of Intent-Based Routing and Progressive Disclosure to reduce decision fatigue. - \*\*Optimized Time-to-F... | implemented | [Link](openspec/changes/nicheai-ux-strategy)                    |
| openspec-agent-cli-upgrade             | The CLI will be refactored into a "Dual-Mode" tool, safely bridging human interactive operation with non-interactive, programmable agentic workflows. ...   | archived    | [Link](openspec/changes/openspec-agent-cli-upgrade)             |
| openspec-continual-learning            | - Introduce a formal Phase 2.5: "Continual Learning & Extraction" into the OpenSpec lifecycle, injected between Verification and Archival phases. - Cr...   | implemented | [Link](openspec/changes/openspec-continual-learning)            |
| openspec-documentation-unification     | 1. Establish an 8-Step Lifecycle by explicitly adding the Validate phase. 2. Add a Halt & Update Loop to the visual state machine for mid-flight spec ...   | implemented | [Link](openspec/changes/openspec-documentation-unification)     |
| openspec-intent-based-testing          | We are updating the custom OpenSpec workflow managed via `.cursor/rules` and `.cursor/skills`. Every new feature implementation will now strictly requ...   | implemented | [Link](openspec/changes/openspec-intent-based-testing)          |
| performance-optimization               | This change introduces aggressive code-splitting for large feature components, defers loading of heavy AI SDKs, natively memoizes the React tree using...   | archived    | [Link](openspec/changes/performance-optimization)               |
| plg-architecture-remediation           | 1. **Migrate Global Limit:** Transition the global anonymous rate limit from Firestore to a Redis distributed counter via atomic `INCR`. 2. \*\*Standard... | archived    | [Link](openspec/changes/plg-architecture-remediation)           |
| plg-journey-optimization               | This OpenSpec overhauls the PLG-to-Workspace journey by stabilizing the streaming UI, ensuring seamless state hydration across the auth boundary (via ...   | archived    | [Link](openspec/changes/plg-journey-optimization)               |
| plg-reverse-demo-hook                  | This OpenSpec overhauls the PLG-to-Workspace journey by stabilizing the streaming UI, ensuring seamless state hydration across the auth boundary (via ...   | archived    | [Link](openspec/changes/plg-reverse-demo-hook)                  |
| plg-teaser-idea-validation             | - **Backend (`src/server/scoringRoutes.ts`)**: Route `/api/scoring/stream` to detect unauthenticated users. Implement Remote Config for model resoluti...   | archived    | [Link](openspec/changes/plg-teaser-idea-validation)             |
| plg-ux-bifurcation                     | We will explicitly bifurcate the User Experience (UX) and Information Architecture (IA) at the Zero Friction Entry, separating user intent immediately...   | archived    | [Link](openspec/changes/plg-ux-bifurcation)                     |
| pql-reverse-demo-trust-builder         | We are revamping the ideation flow to be a Trust-Building Progressive Disclosure journey, culminating in a high-converting PQL gate. 1. \*\*The Trust B...  | archived    | [Link](openspec/changes/pql-reverse-demo-trust-builder)         |
| pql-trust-builder                      | The ideation flow is being revamped into a Trust-Building Progressive Disclosure journey, culminating in a high-converting PQL gate. Key changes inclu...   | archived    | [Link](openspec/changes/pql-trust-builder)                      |
| proactive-market-analysis              | - Introduce a progressive sync banner that displays real-time background task progress without blocking the chat. - Add data freshness indicators (sta...   | archived    | [Link](openspec/changes/proactive-market-analysis)              |
| product-evolution-engine               | NicheAI will evolve from tracking a static "My Product" object into an **Evolution Engine**. Users can start with a seed idea, ingest market data, com...   | superseded  | [Link](openspec/changes/product-evolution-engine)               |
| raw-data-image-storage                 | We are introducing persistent cloud storage for user-uploaded images using **Supabase Storage**. Before images are sent to the AI for analysis, the R...    | archived    | [Link](openspec/changes/raw-data-image-storage)                 |
| react19-firebase-sync                  | 1. **Adopt "Snapshot-Only" Approach**: Completely reject parallel `get()` fetches in favor of strictly relying on `onSnapshot` with built-in metadata ...   | completed   | [Link](openspec/changes/react19-firebase-sync)                  |
| reverse-demo-hook-plg                  | 1. **Zero-Friction Entry:** We will remove the initial `<AuthScreen />` and replace the multi-step onboarding with a single input: "What are you think...   | archived    | [Link](openspec/changes/reverse-demo-hook-plg)                  |
| sanitize-system-logs                   | 1. Hide the "View Context Data" and "View Response Details" sections in the System Logs UI for non-superadmin users. 2. Sanitize log messages to repla...   | archived    | [Link](openspec/changes/sanitize-system-logs)                   |
| scale-to-zero-deployment-docs          | The `README.md` will be updated with a comprehensive "☁️ Scale-to-Zero Deployment Guide". This guide will break down the deployment into discrete, cop...   | archived    | [Link](openspec/changes/scale-to-zero-deployment-docs)          |
| smart-llm-routing                      | We are introducing an "Auto (Smart Routing)" mode as the default behavior. The application code will define whether a specific AI flow requires a `fas...   | archived    | [Link](openspec/changes/smart-llm-routing)                      |
| strategy-toolbox                       | Replacing the static, rigid "Analytical Template Library" with a dynamic, data-driven "Strategy Toolbox". This tool transforms passive form-filling in...   | archived    | [Link](openspec/changes/strategy-toolbox)                       |
| supabase-integration                   | 1. **Database Multi-tenancy**: Adding `team_id` to `raw_data_assets`, `raw_data_versions`, and `raw_data_inbox`. 2. **Supabase Client**: Updated to in...   | archived    | [Link](openspec/changes/supabase-integration)                   |
| superadmin-data-quality-control        | We will add a "Data Quality & Control" tab within the NicheAI Superadmin Dashboard. To avoid OLAP anti-patterns and IAM bloat, this feature introduces...   | archived    | [Link](openspec/changes/superadmin-data-quality-control)        |
| superadmin-feature-controls            | 1. **View-As Toggle (Impersonation)**: A toggle in the Superadmin Dashboard to drop superadmin privileges temporarily for the current session, allowin...   | archived    | [Link](openspec/changes/superadmin-feature-controls)            |
| sync-fallback                          | 1. **Real-time Fallback Path**: Implement a synchronous fallback (Exa -> Gemini Flash) for unseeded hyper-niches. 2. **Circuit Breaker**: Add a Circui...   | archived    | [Link](openspec/changes/sync-fallback)                          |
| system-logs-ux                         | 1. **Label Obfuscation**: Map internal AI and search tool names to generic action labels in the UI. 2. **Collapsible API Details**: Refactor the "API ...   | archived    | [Link](openspec/changes/system-logs-ux)                         |
| test-coverage-and-quality              | 1. **Intent-Based Tests:** Addition of comprehensive test suites using Vitest, React Testing Library (RTL), and MSW for newly modified/added UI compon...   | archived    | [Link](openspec/changes/test-coverage-and-quality)              |
| test-coverage-expansion                | - Enforce an 80% branch and intent-based test coverage threshold using Vitest (`v8` provider). - Implement robust, isolated integration tests directly...   | implemented | [Link](openspec/changes/test-coverage-expansion)                |
| test-coverage-quality                  | 1. **Intent-Based Tests:** Comprehensive test suites for recently modified/added files using Vitest, React Testing Library (RTL), and MSW, focusing on...   | archived    | [Link](openspec/changes/test-coverage-quality)                  |
| tooltip-activation-fix                 | - Update the wrapper for `SyncNowButton` to tightly fit the button. - Ensure that the "Sync Now" tooltip correctly uses `invisible` and `group-hover:v...   | archived    | [Link](openspec/changes/tooltip-activation-fix)                 |
| unified-ideation-and-evolution         | A complete overhaul of the initial onboarding and product ideation experience, evolving it into the "Unified Ideation & Evolution Engine." We are repl...   | archived    | [Link](openspec/changes/unified-ideation-and-evolution)         |
| update-coverage-threshold-80           | The enforced coverage threshold across the repository documentation, rules, and skills will be updated to 80%....                                           | implemented | [Link](openspec/changes/update-coverage-threshold-80)           |
| url-onboarding-plg                     | - Introduce a new intent/flow in `ZeroFrictionEntry` where users can input a URL. - Implement an Express BFF endpoint using Gemini Flash-Lite to scrap...   | archived    | [Link](openspec/changes/url-onboarding-plg)                     |

<!-- OPENSPEC_TABLE_END -->

## 📈 Recent Momentum

<!-- GIT_HISTORY_START -->

- fix(e2e): mock Firestore perms in playwright mock_auth to stabilize E2E reliability (a7247de) - 2026-04-05
- chore: exclude functions directory from root tsconfig (cf34ad7) - 2026-04-05
- fix(e2e): resolve react crashes during mock auth and fix workspace tab routing (9a0d78e) - 2026-04-05
- fix: provide actionable instructions for missing Firebase auth config in ZeroFrictionEntry (58f4131) - 2026-04-05
- test: fix e2e tests hanging due to missing persona mock in mock_auth mode (64df929) - 2026-04-05
- chore(ci): force push to trigger github actions pipeline (ab24aa3) - 2026-04-05
- fix(tests): add proper default export for firebase-admin mock (3e0affb) - 2026-04-05
- fix(ci): add write permissions to update-docs job and fix roadmap extractor args (e59e749) - 2026-04-05
- fix(workers): prevent crash via optional chaining on admin.apps.length (3cb7d97) - 2026-04-05
- fix(ZeroFrictionEntry): wire up URL intent for onboarding tests (c7edc33) - 2026-04-05
- fix(ci): provide GCP_PROJECT_ID fallbacks and skip defunct startup env validation tests (63f1a3a) - 2026-04-05
- fix(ci): remove zod-fast-check to resolve npm ci ERESOLVE error (0836ba0) - 2026-04-05
- fix(ci): resolve unit test OOM and playwright startup failures (3b91979) - 2026-04-05
- fix(build): resolve typescript compilation errors across worker routes and custom search proxy (1f422e7) - 2026-04-05
- feat(superadmin): implement superadmin data quality dashboard & pipeline control circuit breaker (55e218b) - 2026-04-05
<!-- GIT_HISTORY_END -->

## 🎯 Sprint Insights & Tech Debt

<!-- TECH_DEBT_START -->

No tech debt recorded.

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
