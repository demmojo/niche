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

| Feature                                | Summary                                                                                                                           | Status      | Link                                                                                              |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------- |
| plg-builder-journey                    | No proposal found.                                                                                                                | archived    | [plg-builder-journey](openspec/changes/plg-builder-journey)                                       |
| ai-model-fallback                      | Introduce a unified AI client that wraps Gemini, OpenAI, and Anthropic SDKs.                                                      | archived    | [ai-model-fallback](openspec/changes/ai-model-fallback)                                           |
| analytical-template-system             | Introduce a unified Analytical Template System that routes users into presentation and analytical flows.                          | archived    | [analytical-template-system](openspec/changes/analytical-template-system)                         |
| architecture-performance-optimization  | Extract heavy subcomponents from `App.tsx` and push volatile state down the component tree.                                       | archived    | [architecture-performance-optimization](openspec/changes/architecture-performance-optimization)   |
| comprehensive-documentation-update     | Update in-app guides, tooltips, onboarding modals, and help pages to reflect current UI changes.                                  | archived    | [comprehensive-documentation-update](openspec/changes/comprehensive-documentation-update)         |
| consolidate-features-modal             | Retroactive documentation of the Consolidate Features Modal feature.                                                              | archived    | [consolidate-features-modal](openspec/changes/consolidate-features-modal)                         |
| data-export-generator                  | Introduce a Comprehensive Data Export & Documentation Generator across the application.                                           | archived    | [data-export-generator](openspec/changes/data-export-generator)                                   |
| data-sync-review                       | Introduce a universal Data Sync Review workflow as a gatekeeper for external data pulls.                                          | archived    | [data-sync-review](openspec/changes/data-sync-review)                                             |
| dev-workflow-and-cicd                  | Implement `lefthook` for parallelized local git hooks and selective pre-commit testing.                                           | archived    | [dev-workflow-and-cicd](openspec/changes/dev-workflow-and-cicd)                                   |
| developer-onboarding-docs              | Enhance developer documentation to ensure smooth onboarding and system understanding.                                             | proposed    | [developer-onboarding-docs](openspec/changes/developer-onboarding-docs)                           |
| documentation-wizard                   | Introduce the DocumentationWizardModal for users to generate and download dynamic documentation.                                  | archived    | [documentation-wizard](openspec/changes/documentation-wizard)                                     |
| feature-videos                         | Transition feature video pipeline from continuous WebM recordings to an agent-browser format.                                     | archived    | [feature-videos](openspec/changes/feature-videos)                                                 |
| gemini-model-upgrade-routing           | Completely remove legacy models and route traffic to current state-of-the-art LLMs.                                               | archived    | [gemini-model-upgrade-routing](openspec/changes/gemini-model-upgrade-routing)                     |
| global-progress-banner                 | Introduce a GlobalProgressBanner to display real-time background task progress.                                                   | archived    | [global-progress-banner](openspec/changes/global-progress-banner)                                 |
| head-to-head-comparison                | Introduce a Head-to-Head Comparison view for direct side-by-side competitor analysis.                                             | archived    | [head-to-head-comparison](openspec/changes/head-to-head-comparison)                               |
| hitl-feature-merging                   | Introduce a Human-in-the-Loop merging system to combine similar competitor features.                                              | archived    | [hitl-feature-merging](openspec/changes/hitl-feature-merging)                                     |
| hybrid-scoring-tarpit-flywheel         | Replace stochastic LLM output with a mathematically rigorous Hybrid Scoring Engine.                                               | archived    | [hybrid-scoring-tarpit-flywheel](openspec/changes/hybrid-scoring-tarpit-flywheel)                 |
| idea-validation-plg-teaser             | Route unauthenticated users to a teaser branch with downgraded LLMs for trial use.                                                | archived    | [idea-validation-plg-teaser](openspec/changes/idea-validation-plg-teaser)                         |
| inject-brand-identity-prompt           | Append the ProjectBrandIdentity properties into structural AI prompts dynamically.                                                | implemented | [inject-brand-identity-prompt](openspec/changes/inject-brand-identity-prompt)                     |
| insight-brainstorm-chat                | Retroactive documentation of the Insight Brainstorm Chat feature.                                                                 | archived    | [insight-brainstorm-chat](openspec/changes/insight-brainstorm-chat)                               |
| insight-generator-modal                | Retroactive documentation of the Insight Generator Modal feature.                                                                 | archived    | [insight-generator-modal](openspec/changes/insight-generator-modal)                               |
| insight-quest-modal                    | Document the implementation of a gamified A/B testing interface wrapped in a farming metaphor.                                    | archived    | [insight-quest-modal](openspec/changes/insight-quest-modal)                                       |
| interactive-tour-guide                 | Introduce a custom, lightweight guided tour component powered by Framer Motion.                                                   | archived    | [interactive-tour-guide](openspec/changes/interactive-tour-guide)                                 |
| market-analysis-features               | Separate the conversational AI from robust Data Points inside the MarketAnalysis view.                                            | archived    | [market-analysis-features](openspec/changes/market-analysis-features)                             |
| market-data-grid                       | Retroactive documentation of the Market Data Grid feature.                                                                        | archived    | [market-data-grid](openspec/changes/market-data-grid)                                             |
| market-value-notebook                  | Retroactive documentation of the Market Value Notebook feature.                                                                   | archived    | [market-value-notebook](openspec/changes/market-value-notebook)                                   |
| marketing-video-automation             | Implement automated mock data pipelines to streamline marketing video generation.                                                 | archived    | [marketing-video-automation](openspec/changes/marketing-video-automation)                         |
| multi-product-and-teams                | Enhance the product dropdown in navigation to support adding new multi-tenant products.                                           | archived    | [multi-product-and-teams](openspec/changes/multi-product-and-teams)                               |
| multiple-visual-whiteboards            | Allow users to create, name, and switch between multiple infinite-canvas whiteboards.                                             | archived    | [multiple-visual-whiteboards](openspec/changes/multiple-visual-whiteboards)                       |
| narrative-feature-videos               | Upgrade video generation to inject highly-realistic, animated macOS-style SVG cursors.                                            | archived    | [narrative-feature-videos](openspec/changes/narrative-feature-videos)                             |
| premium-teaser-fingerprinting          | Implement anonymous device fingerprinting and upgrade stream endpoints for teaser features.                                       | archived    | [premium-teaser-fingerprinting](openspec/changes/premium-teaser-fingerprinting)                   |
| rapid-pdlc-prompt-exporter             | Introduce a zero-cost, client-side Prompt Assembler to streamline the Strategy-to-Code workflow.                                  | implemented | [rapid-pdlc-prompt-exporter](openspec/changes/rapid-pdlc-prompt-exporter)                         |
| raw-data-library                       | Introduce a multi-modal Raw Data Library backed by PostgreSQL for handling diverse asset types.                                   | archived    | [raw-data-library](openspec/changes/raw-data-library)                                             |
| remove-inspire-radio                   | Completely remove the InspiringRadioWidget component and its associated tests.                                                    | archived    | [remove-inspire-radio](openspec/changes/remove-inspire-radio)                                     |
| test-coverage-expansion                | Introduce a comprehensive suite of unit tests for the visual knowledge store and whiteboard UI.                                   | archived    | [test-coverage-expansion](openspec/changes/test-coverage-expansion)                               |
| test-coverage-expansion-phase2         | Refine existing tests and add new suites for critical hooks, utilities, and components.                                           | archived    | [test-coverage-expansion-phase2](openspec/changes/test-coverage-expansion-phase2)                 |
| test-coverage-tarpit-tollgate          | Implement a non-brittle, comprehensive Boundary Testing Approach using Vitest, MSW, and Playwright.                               | archived    | [test-coverage-tarpit-tollgate](openspec/changes/test-coverage-tarpit-tollgate)                   |
| testing-architecture-modernization     | Modernize the testing architecture by shifting to the Testing Trophy methodology.                                                 | archived    | [testing-architecture-modernization](openspec/changes/testing-architecture-modernization)         |
| ast-driven-drift-healing               | Transform documentation drift detection into a proactive Strategic Sprint Engine via AST.                                         | archived    | [ast-driven-drift-healing](openspec/changes/ast-driven-drift-healing)                             |
| atomic-staging-safeguards              | Introduce interactive overwrite warnings and atomic staging tools to the OpenSpec CLI.                                            | archived    | [atomic-staging-safeguards](openspec/changes/atomic-staging-safeguards)                           |
| bq-search-signals                      | Implement logic to execute native partitioned BigQuery queries for enhanced search signals.                                       | archived    | [bq-search-signals](openspec/changes/bq-search-signals)                                           |
| brand-positioning-wizard               | Introduce a wizard that parses competitor identities to assemble cohesive brand guidelines.                                       | implemented | [brand-positioning-wizard](openspec/changes/brand-positioning-wizard)                             |
| bug-hunt-test-review                   | Conduct a thorough bug hunt, resolve issues, and establish rigorous testing standards.                                            | archived    | [bug-hunt-test-review](openspec/changes/bug-hunt-test-review)                                     |
| calibrated-transparent-ai              | Implement Calibrated Trust UX patterns including Zero Data Retention receipts.                                                    | archived    | [calibrated-transparent-ai](openspec/changes/calibrated-transparent-ai)                           |
| cloud-run-scale-to-zero                | Introduce distroless multi-stage Docker builds and terraform modules for serverless scaling.                                      | archived    | [cloud-run-scale-to-zero](openspec/changes/cloud-run-scale-to-zero)                               |
| cloud-tasks-local-simulator            | Refactor the local development setup for true offline operation via Firebase Emulators.                                           | archived    | [cloud-tasks-local-simulator](openspec/changes/cloud-tasks-local-simulator)                       |
| cloudflare-deployment-analytics-engine | Replace mocked environments with production-grade infrastructure and analytics on Cloudflare.                                     | archived    | [cloudflare-deployment-analytics-engine](openspec/changes/cloudflare-deployment-analytics-engine) |
| codebase-test-quality-review           | Execute a structured review of the entire codebase to improve robustness and resolve bugs.                                        | archived    | [codebase-test-quality-review](openspec/changes/codebase-test-quality-review)                     |
| competitor-discovery-frontend          | Update global sync states to gracefully handle empty competitor arrays with explainable loading.                                  | completed   | [competitor-discovery-frontend](openspec/changes/competitor-discovery-frontend)                   |
| competitor-discovery-review            | Introduce a synchronous Human-in-the-Loop Competitor Curation step during deep validation.                                        | implemented | [competitor-discovery-review](openspec/changes/competitor-discovery-review)                       |
| comprehensive-documentation            | Overhaul all documentation and user onboarding guides using progressive disclosure.                                               | archived    | [comprehensive-documentation](openspec/changes/comprehensive-documentation)                       |
| comprehensive-test-coverage            | Roll out expansive intent-based testing using Vitest, RTL, MSW, and Firebase emulators.                                           | archived    | [comprehensive-test-coverage](openspec/changes/comprehensive-test-coverage)                       |
| deduplication-algorithm                | Formalize a Tri-Tiered Waterfall Matching Strategy to efficiently group related raw data.                                         | archived    | [deduplication-algorithm](openspec/changes/deduplication-algorithm)                               |
| dummy-spec                             | No proposal found.                                                                                                                | implemented | [dummy-spec](openspec/changes/dummy-spec)                                                         |
| dynamic-test-scaling                   | Deploy hardware-aware resource allocation logic dynamically for test runners.                                                     | archived    | [dynamic-test-scaling](openspec/changes/dynamic-test-scaling)                                     |
| educational-tone-refactor              | Update the global CO-STAR User Rule to mandate Anchor and Define patterns.                                                        | implemented | [educational-tone-refactor](openspec/changes/educational-tone-refactor)                           |
| enterprise-ml-orchestration            | Adopt Contextual Queueing Bandits for dynamic model routing mapped directly to specific tasks.                                    | archived    | [enterprise-ml-orchestration](openspec/changes/enterprise-ml-orchestration)                       |
| exa-api-key-fallback                   | Configure secondary API keys for seamless search fallback when limits are reached.                                                | archived    | [exa-api-key-fallback](openspec/changes/exa-api-key-fallback)                                     |
| fetch-with-app-check-fix               | Wrap fetch calls in robust exponential backoff retry utilities rather than relying on stale cached values.                        | completed   | [fetch-with-app-check-fix](openspec/changes/fetch-with-app-check-fix)                             |
| global-anonymous-limits                | Add a Firestore-backed daily global circuit breaker for total anonymous teaser limits.                                            | superseded  | [global-anonymous-limits](openspec/changes/global-anonymous-limits)                               |
| hyper-scale-saas-data-moat-pipeline    | Launch a Serverless Extraction & LLM Synthesis pipeline optimized for data-moat construction.                                     | archived    | [hyper-scale-saas-data-moat-pipeline](openspec/changes/hyper-scale-saas-data-moat-pipeline)       |
| ideation-workflow                      | Introduce the Product Ideation & Niche Discovery Workflow to drastically overhaul initial onboarding.                             | superseded  | [ideation-workflow](openspec/changes/ideation-workflow)                                           |
| image-import                           | Extend UploadDataModal to easily accept multi-format image files via drag-and-drop or clipboard.                                  | archived    | [image-import](openspec/changes/image-import)                                                     |
| intent-based-testing                   | Systematically enforce intent-based testing suites specifically for major P0 platform features.                                   | implemented | [intent-based-testing](openspec/changes/intent-based-testing)                                     |
| ml-orchestration-system                | Upgrade from static routing models to intelligent multi-tier dynamic asynchronous queueing.                                       | implemented | [ml-orchestration-system](openspec/changes/ml-orchestration-system)                               |
| mlp-hands-on-review                    | Audit and secure the anonymous PLG flows along with implementing targeted anti-abuse measures.                                    | archived    | [mlp-hands-on-review](openspec/changes/mlp-hands-on-review)                                       |
| multi-category-mentions                | Integrate a Supabase-backed autocomplete mention system natively inside the Tiptap text editor.                                   | archived    | [multi-category-mentions](openspec/changes/multi-category-mentions)                               |
| multi-product-workspace                | Architect a top-level WorkspaceProvider specifically designed to easily govern concurrent multi-product sessions.                 | archived    | [multi-product-workspace](openspec/changes/multi-product-workspace)                               |
| mvp-analytics-superadmin               | Replace complex Recharts with standard impersonation tables and simple metric tracking dashboards.                                | archived    | [mvp-analytics-superadmin](openspec/changes/mvp-analytics-superadmin)                             |
| navbar-logical-ordering                | Strategically group navigation sidebars based strictly on intuitive user-workflow progression.                                    | archived    | [navbar-logical-ordering](openspec/changes/navbar-logical-ordering)                               |
| next-gen-analytics                     | Replace static views with a dynamic Triple-Mode Smart Compose reporting canvas powered by LLMs.                                   | archived    | [next-gen-analytics](openspec/changes/next-gen-analytics)                                         |
| niche-radar-plg-loop                   | Implement a reverse-demo driven Product-Led Growth funnel mapped to high-conversion endpoints.                                    | archived    | [niche-radar-plg-loop](openspec/changes/niche-radar-plg-loop)                                     |
| nicheai-ux-strategy                    | Apply Intent-Based Routing and Progressive Disclosure patterns to cut decision fatigue significantly.                             | implemented | [nicheai-ux-strategy](openspec/changes/nicheai-ux-strategy)                                       |
| openspec-agent-cli-upgrade             | Safely bridge human interactive toolchains with strictly programmatic autonomous agent workflows.                                 | archived    | [openspec-agent-cli-upgrade](openspec/changes/openspec-agent-cli-upgrade)                         |
| openspec-continual-learning            | Add an explicit Continual Learning phase strictly inserted between Verification and Archival steps.                               | implemented | [openspec-continual-learning](openspec/changes/openspec-continual-learning)                       |
| openspec-documentation-unification     | Formalize the custom OpenSpec lifecycle fully into a standard 8-step process with valid Halt loops.                               | implemented | [openspec-documentation-unification](openspec/changes/openspec-documentation-unification)         |
| openspec-intent-based-testing          | Mandate that all features generated strictly supply robust corresponding unit boundary tests.                                     | implemented | [openspec-intent-based-testing](openspec/changes/openspec-intent-based-testing)                   |
| performance-optimization               | Implement robust aggressive code-splitting and native React tree memoization across the platform.                                 | archived    | [performance-optimization](openspec/changes/performance-optimization)                             |
| plg-architecture-remediation           | Transition global rate limits off Firestore directly to a highly-available Redis atomic counter.                                  | archived    | [plg-architecture-remediation](openspec/changes/plg-architecture-remediation)                     |
| plg-builder-journey                    | Overhaul builder interactions bridging unauthenticated entry forms to deep-authenticated user flows.                              | archived    | [plg-builder-journey](openspec/changes/plg-builder-journey)                                       |
| plg-journey-optimization               | Radically stabilize streaming UI hydration boundaries to prevent auth state wipeouts entirely.                                    | archived    | [plg-journey-optimization](openspec/changes/plg-journey-optimization)                             |
| plg-reverse-demo-hook                  | Smooth out the PLG-to-Workspace transition strictly guaranteeing fluid cross-authentication hydration.                            | archived    | [plg-reverse-demo-hook](openspec/changes/plg-reverse-demo-hook)                                   |
| plg-teaser-idea-validation             | Refactor specific backend endpoints to enforce limits mapping directly to robust anonymous payloads.                              | archived    | [plg-teaser-idea-validation](openspec/changes/plg-teaser-idea-validation)                         |
| plg-ux-bifurcation                     | Force strict bifurcation logic on zero-friction entries strictly tailored exactly to detected user intent.                        | archived    | [plg-ux-bifurcation](openspec/changes/plg-ux-bifurcation)                                         |
| pql-reverse-demo-trust-builder         | Reshape standard onboarding natively to a Trust-Building path targeting strong PQL metric events.                                 | archived    | [pql-reverse-demo-trust-builder](openspec/changes/pql-reverse-demo-trust-builder)                 |
| pql-trust-builder                      | Overhaul core onboarding flow to inherently guide users immediately to a high-converting PQL gate.                                | archived    | [pql-trust-builder](openspec/changes/pql-trust-builder)                                           |
| proactive-market-analysis              | Display discrete data freshness indicators seamlessly along with non-blocking real-time sync banners.                             | archived    | [proactive-market-analysis](openspec/changes/proactive-market-analysis)                           |
| product-evolution-engine               | Transform NicheAI from passively logging static ideas strictly into an active dynamic evolution model.                            | superseded  | [product-evolution-engine](openspec/changes/product-evolution-engine)                             |
| raw-data-image-storage                 | Integrate Supabase explicitly to strictly govern external robust persistent user image storage states.                            | archived    | [raw-data-image-storage](openspec/changes/raw-data-image-storage)                                 |
| react19-firebase-sync                  | Reject standard fetches inherently in favor strictly of metadata-rich snapshot implementations fully.                             | completed   | [react19-firebase-sync](openspec/changes/react19-firebase-sync)                                   |
| reverse-demo-hook-plg                  | Deprecate massive onboarding flows entirely by routing directly to simple single-input hooks initially.                           | archived    | [reverse-demo-hook-plg](openspec/changes/reverse-demo-hook-plg)                                   |
| sanitize-system-logs                   | Restrict raw sensitive debug parameters directly forcing standard generic labeling natively to users.                             | archived    | [sanitize-system-logs](openspec/changes/sanitize-system-logs)                                     |
| scale-to-zero-deployment-docs          | Append thorough Scale-to-Zero Deployment discrete guides systematically to top-level platform READMEs.                            | archived    | [scale-to-zero-deployment-docs](openspec/changes/scale-to-zero-deployment-docs)                   |
| smart-llm-routing                      | Activate Auto-Routing by implicitly allowing specific application code boundaries to determine fast/precise flows dynamically.    | archived    | [smart-llm-routing](openspec/changes/smart-llm-routing)                                           |
| strategy-toolbox                       | Replace rigid manual template entry libraries entirely with fundamentally automated data-driven toolboxes.                        | archived    | [strategy-toolbox](openspec/changes/strategy-toolbox)                                             |
| supabase-integration                   | Introduce database multi-tenancy and configure specialized native clients to interface immediately.                               | archived    | [supabase-integration](openspec/changes/supabase-integration)                                     |
| superadmin-data-quality-control        | Securely isolate critical IAM data-quality modification panels securely via simple dashboard tabs directly.                       | archived    | [superadmin-data-quality-control](openspec/changes/superadmin-data-quality-control)               |
| superadmin-feature-controls            | Allow temporary targeted privilege drops via clear explicit View-As logic directly on top dashboards.                             | archived    | [superadmin-feature-controls](openspec/changes/superadmin-feature-controls)                       |
| sync-fallback                          | Establish crucial synchronous LLM paths seamlessly backing up unseeded highly-complex niche hyper-states securely.                | archived    | [sync-fallback](openspec/changes/sync-fallback)                                                   |
| system-logs-ux                         | Remap complex backend execution details to simple collapsible plain-English generic action logs structurally.                     | archived    | [system-logs-ux](openspec/changes/system-logs-ux)                                                 |
| test-coverage-and-quality              | Push strictly isolated React Testing Library boundary tests covering specific highly-used core views entirely.                    | archived    | [test-coverage-and-quality](openspec/changes/test-coverage-and-quality)                           |
| test-coverage-expansion                | Impose specific hard eighty-percent test minimums completely mapped across robust targeted intent implementations.                | implemented | [test-coverage-expansion](openspec/changes/test-coverage-expansion)                               |
| test-coverage-quality                  | Build massive suites structurally guaranteeing targeted isolated regression protection strictly natively.                         | archived    | [test-coverage-quality](openspec/changes/test-coverage-quality)                                   |
| tooltip-activation-fix                 | Overhaul strictly localized wrapper styling bugs actively preventing consistent tooltips.                                         | archived    | [tooltip-activation-fix](openspec/changes/tooltip-activation-fix)                                 |
| unified-ideation-and-evolution         | Rearchitect initial platform encounters converting discrete workflows entirely into continuous iterative engines comprehensively. | archived    | [unified-ideation-and-evolution](openspec/changes/unified-ideation-and-evolution)                 |
| update-coverage-threshold-80           | Explicitly alter platform configuration structures uniformly enforcing 80% boundaries totally.                                    | implemented | [update-coverage-threshold-80](openspec/changes/update-coverage-threshold-80)                     |
| url-onboarding-plg                     | Activate entirely parallel Zero Friction branches implicitly scraping target sites completely natively dynamically.               | archived    | [url-onboarding-plg](openspec/changes/url-onboarding-plg)                                         |

<!-- OPENSPEC_TABLE_END -->

## 📈 Recent Momentum

<!-- GIT_HISTORY_START -->

- **feat**: Added tests and remaining components for PLG builder.
- **feat**: Added tests for NodeGraphPipeline.
- **test**: Ensure >95% coverage for recent PLG builder components.
- **fix**: Restore components to vitest coverage exclude to fix global threshold.
- **fix**: Import `vi` in ConstraintEngine.test.tsx.
- **refactor**: Address product strategy critique in ZeroFrictionEntry.
- **refactor**: De-slop NodeGraphPipeline and enhance interaction states.
- **refactor**: Address design, pattern, and framework review feedback.
- **refactor**: Apply design and pattern specialist reviews, fix a11y and UX gaps.
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
