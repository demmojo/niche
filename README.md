<div align="center">
  <img width="1200" height="475" alt="NicheAI Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
  <h1>NicheAI</h1>
  <p>An advanced, AI-driven Competitive Intelligence & Market Analysis tool</p>
</div>

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

### How to use the OpenSpec Workflow (Developer Guide)

The OpenSpec workflow is designed to prevent context bloat, eliminate overlapping features, and ensure what is built exactly matches what was planned. It is primarily driven by Cursor AI agents, but can be managed manually via the CLI.

#### 1. Pre-flight / Planning Phase

When you have a new idea or feature request, do not start coding immediately. Instead:

1. **Write a Plan:** Create a markdown brainstorm or plan in `docs/plans/`.
2. **Check for Overlaps:** Ensure your feature doesn't conflict with existing specs.
3. **Ingest the Plan:** The system automatically transforms your raw plan into the strict 5-file OpenSpec structure (`proposal.md`, `design.md`, `spec.md`, `tasks.md`, and `.openspec.yaml`) inside `openspec/changes/<feature-name>`.
4. **Validate & Eval:** The dependency DAG is checked for cycles, and an LLM-as-a-judge scores the spec for ambiguity, architectural constraints, and backward compatibility.

#### 2. Implementation Phase (The "Halt and Update" Pattern)

This is our in-house best-practice pattern that guarantees specs and code never diverge. The AI agent handles this automatically.

1. **Verify Readiness:** The agent checks if all prerequisite specs are completed. If dependencies aren't met, it refuses to start.
2. **Build Context:** The agent generates an optimized GraphRAG prompt that provides deep local context, preventing LLM context window issues.
3. **Execute Tasks:** The agent follows the actionable checkbox list sequentially in `tasks.md`. As it completes tasks, it marks them done (`- [x]`).
4. **Strict Adherence & 'Halt and Update' Protocol:** The agent may not deviate from the architecture outlined in `design.md` or the flows in `spec.md`. If it hits a technical roadblock, constraint, or decides on a better approach:
   - **IT MUST HALT CODING.**
   - It will stop and proactively ask the developer what to do.
   - Once the developer agrees on the new approach, the _agent automatically edits_ `design.md` (e.g., adding to "Alternatives Considered" or "Risks/Trade-offs") or `spec.md` to reflect the new reality.
   - _Only after the agent updates the spec will it write the new code._

**Why we do this:**

- **Prevents LLM Context Bloat:** Breaking specs into 5 files and using localized context building keeps prompts lean.
- **Prevents Divergence:** The "Halt and Update" protocol ensures the documentation is always the true source of truth.
- **Prevents Scope Creep:** The `ai-eval` step blocks ambiguous specs from entering implementation, stopping developers or agents from "guessing" requirements.
- **Prevents Collisions:** The ML-powered collision detection ensures two developers don't build duplicate features.

#### 3. Automated Enforcement via Git Hooks (Lefthook) & Cursor Rules

The OpenSpec workflow is natively enforced via automated Git hooks (`lefthook.yml`) and Cursor AI rules (`.cursor/rules/openspec-workflow.mdc`) to ensure compliance:

**Cursor AI Enforcement (`.cursor/rules/openspec-workflow.mdc`):**

- The AI agent is explicitly **FORBIDDEN** from executing code directly from raw markdown brainstorms in `docs/plans/`. It will forcefully halt and demand the plan be ingested.
- The AI agent is programmed to halt implementation if `check-ready` fails (blocking dependencies exist).
- **Proactive AI "Halt and Update":** If the AI agent hits a roadblock or constraint mid-flight, it is programmed to halt coding, proactively ask the developer for input, and automatically rewrite `design.md` or `spec.md` for them using its editing tools. The developer does not need to run a CLI script to do this.

**Git Hook Enforcement (`lefthook.yml`):**

- **Pre-commit (`openspec`)**: Every time you commit an OpenSpec file, the system automatically validates the DAG.
- **Pre-commit (`extract-roadmap`)**: The ML-powered Roadmap Extractor automatically scans modified `design.md` and `proposal.md` files to extract deferred features, "Non-Goals", and "Alternatives Considered", appending them to the living `docs/ROADMAP.md`.
- **Pre-commit (`drift-healer`)**: Runs ML-powered documentation drift detection on modified code to ensure code comments match actual functionality.
- **Pre-push (`generate-docs`)**: Automatically updates this `README.md` with the latest status table of all planned, active, and completed features.

#### 4. Manual Developer Commands (CLI)

While the AI agent handles most of the workflow automatically, developers can manually run the following OpenSpec CLI scripts to interact with the system:

| Command                                                             | Description                                                                                      |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `npx tsx scripts/openspec-cli/index.ts detect-collisions`           | Scans existing specs using vector embeddings to detect semantic overlaps with new proposals.     |
| `npx tsx scripts/openspec-cli/index.ts ingest docs/plans/<plan.md>` | Ingests a raw markdown plan, automatically generating the 5-file OpenSpec structure.             |
| `npx tsx scripts/openspec-cli/index.ts validate`                    | Validates the integrity of the OpenSpec YAML files and ensures the dependency DAG has no cycles. |
| `npx tsx scripts/openspec-cli/index.ts ai-eval`                     | Runs the LLM-as-a-judge semantic pass on draft specs to evaluate ambiguity and constraints.      |
| `npx tsx scripts/openspec-cli/index.ts check-ready <feature>`       | Verifies that all dependencies for a feature have been marked as implemented.                    |
| `npx tsx scripts/openspec-cli/index.ts build-context <feature>`     | Generates an optimized GraphRAG context prompt for the AI agent to implement the feature.        |

<!-- OPENSPEC_TABLE_START -->

| Feature                                | Summary                                                                                                        | Status     | Link                                                            |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------- |
| cloudflare-deployment-analytics-engine | Migrating from mocked components to a production-grade deployment and analytics infrastructure.                | draft      | [View](openspec/changes/cloudflare-deployment-analytics-engine) |
| comprehensive-documentation            | A massive platform-wide overhaul of all documentation, onboarding guides, and progressive disclosure patterns. | draft      | [View](openspec/changes/comprehensive-documentation)            |
| deduplication-algorithm                | Formalizing a Tri-Tiered Waterfall Matching Strategy to identify related raw data.                             | draft      | [View](openspec/changes/deduplication-algorithm)                |
| exa-api-key-fallback                   | Introducing a secondary Exa API key to be used as a fallback in our code.                                      | draft      | [View](openspec/changes/exa-api-key-fallback)                   |
| gemini-model-upgrade-routing           | Complete removal of legacy models, replacing them with current state-of-the-art models.                        | draft      | [View](openspec/changes/gemini-model-upgrade-routing)           |
| head-to-head-comparison                | Introducing a Head-to-Head Comparison view allowing users to select up to 2 competitors.                       | draft      | [View](openspec/changes/head-to-head-comparison)                |
| ideation-workflow                      | Introducing the Product Ideation & Niche Discovery Workflow to radically overhaul the onboarding experience.   | superseded | [View](openspec/changes/ideation-workflow)                      |
| image-import                           | Extending the UploadDataModal to accept image files via direct upload or clipboard paste.                      | draft      | [View](openspec/changes/image-import)                           |
| multi-category-mentions                | Introducing a real-time, multi-category autocomplete mention system into the chat interface.                   | draft      | [View](openspec/changes/multi-category-mentions)                |
| navbar-logical-ordering                | Reordering and logically grouping sidebar navigation items to reflect a workflow-based pattern.                | draft      | [View](openspec/changes/navbar-logical-ordering)                |
| next-gen-analytics                     | Introducing the Next-Gen Analytics Platform with a dynamic, Triple-Mode Smart Compose reporting canvas.        | draft      | [View](openspec/changes/next-gen-analytics)                     |
| performance-optimization               | Introducing aggressive code-splitting, deferred loading, and native memoization to optimize performance.       | draft      | [View](openspec/changes/performance-optimization)               |
| proactive-market-analysis              | Introducing a progressive sync banner to display real-time background task progress.                           | draft      | [View](openspec/changes/proactive-market-analysis)              |
| product-evolution-engine               | Evolving NicheAI from tracking a static object into an Evolution Engine that dynamically ingests market data.  | superseded | [View](openspec/changes/product-evolution-engine)               |
| rapid-pdlc-prompt-exporter             | Introducing a Rapid PDLC Workflow featuring a zero-cost, client-side Prompt Assembler.                         | draft      | [View](openspec/changes/rapid-pdlc-prompt-exporter)             |
| raw-data-image-storage                 | Introducing persistent cloud storage for user-uploaded images using Supabase Storage.                          | draft      | [View](openspec/changes/raw-data-image-storage)                 |
| sanitize-system-logs                   | Hiding sensitive context data and sanitizing log messages for non-superadmin users.                            | draft      | [View](openspec/changes/sanitize-system-logs)                   |
| smart-llm-routing                      | Introducing an Auto mode to intelligently route AI flows to fast, smart, or agentic models.                    | draft      | [View](openspec/changes/smart-llm-routing)                      |
| strategy-toolbox                       | Replacing the static Analytical Template Library with a dynamic, data-driven Strategy Toolbox.                 | draft      | [View](openspec/changes/strategy-toolbox)                       |
| supabase-integration                   | Adding database multi-tenancy and updating the Supabase client.                                                | draft      | [View](openspec/changes/supabase-integration)                   |
| superadmin-feature-controls            | Adding a View-As Toggle in the Superadmin Dashboard to allow testing standard user flows.                      | draft      | [View](openspec/changes/superadmin-feature-controls)            |
| system-logs-ux                         | Mapping internal AI and search tool names to generic action labels and refactoring the UI.                     | draft      | [View](openspec/changes/system-logs-ux)                         |
| tooltip-activation-fix                 | Updating the wrapper for the SyncNowButton to ensure tooltips activate correctly.                              | draft      | [View](openspec/changes/tooltip-activation-fix)                 |
| unified-ideation-and-evolution         | A complete overhaul of the initial onboarding and product ideation experience.                                 | draft      | [View](openspec/changes/unified-ideation-and-evolution)         |
| ai-model-fallback                      | Introducing a unified AI client that wraps Gemini, OpenAI, and Anthropic SDKs with user API key support.       | draft      | [View](openspec/changes/ai-model-fallback)                      |
| analytical-template-system             | Introducing a unified Analytical Template System to route users into presentation or interactive templates.    | draft      | [View](openspec/changes/analytical-template-system)             |
| architecture-performance-optimization  | Extracting heavy subcomponents from the monolith into separate files.                                          | draft      | [View](openspec/changes/architecture-performance-optimization)  |
| comprehensive-documentation-update     | Updating in-app guides, tooltips, onboarding modals, and help pages to reflect the current feature set.        | draft      | [View](openspec/changes/comprehensive-documentation-update)     |
| consolidate-features-modal             | Retroactive documentation of the Consolidate Features Modal feature.                                           | draft      | [View](openspec/changes/consolidate-features-modal)             |
| data-export-generator                  | Introducing a Comprehensive Data Export & Documentation Generator across the application.                      | draft      | [View](openspec/changes/data-export-generator)                  |
| data-sync-review                       | Introducing a universal Data Sync Review workflow as a gatekeeper for external data pulls and AI updates.      | draft      | [View](openspec/changes/data-sync-review)                       |
| dev-workflow-and-cicd                  | Implementing lefthook for parallelized local git hooks and selectively running pre-commit tests.               | draft      | [View](openspec/changes/dev-workflow-and-cicd)                  |
| developer-onboarding-docs              | Enhancing developer documentation to ensure smoother onboarding and context sharing.                           | proposed   | [View](openspec/changes/developer-onboarding-docs)              |
| documentation-wizard                   | Introducing a wizard allowing users to select features, formats, and export tailored documentation.            | draft      | [View](openspec/changes/documentation-wizard)                   |
| feature-videos                         | Transitioning the feature video generation pipeline to an agent-browser approach.                              | draft      | [View](openspec/changes/feature-videos)                         |
| global-progress-banner                 | Introducing a global progress banner to display active background task progress across the application layout. | draft      | [View](openspec/changes/global-progress-banner)                 |
| insight-brainstorm-chat                | Retroactive documentation of the Insight Brainstorm Chat feature.                                              | draft      | [View](openspec/changes/insight-brainstorm-chat)                |
| insight-generator-modal                | Retroactive documentation of the Insight Generator Modal feature.                                              | draft      | [View](openspec/changes/insight-generator-modal)                |
| insight-quest-modal                    | Documenting the implementation of a gamified A/B testing interface wrapped in a farming metaphor.              | draft      | [View](openspec/changes/insight-quest-modal)                    |
| interactive-tour-guide                 | Building a custom, lightweight, React 19-compatible guided tour component powered by Framer Motion.            | draft      | [View](openspec/changes/interactive-tour-guide)                 |
| market-analysis-features               | Introducing a tabbed interface to separate conversational AI from robust structured insights.                  | draft      | [View](openspec/changes/market-analysis-features)               |
| market-data-grid                       | Retroactive documentation of the Market Data Grid feature.                                                     | draft      | [View](openspec/changes/market-data-grid)                       |
| market-value-notebook                  | Retroactive documentation of the Market Value Notebook feature.                                                | draft      | [View](openspec/changes/market-value-notebook)                  |
| marketing-video-automation             | Implementing marketing video automation and mock data to streamline video generation.                          | draft      | [View](openspec/changes/marketing-video-automation)             |
| multi-product-and-teams                | Enhancing the product dropdown to support adding new products and teams.                                       | draft      | [View](openspec/changes/multi-product-and-teams)                |
| multiple-visual-whiteboards            | Allowing users to create, name, switch between multiple infinite-canvas whiteboards, and use templates.        | draft      | [View](openspec/changes/multiple-visual-whiteboards)            |
| narrative-feature-videos               | Upgrading feature video generation to inject a highly-realistic animated macOS-style SVG cursor.               | draft      | [View](openspec/changes/narrative-feature-videos)               |
| raw-data-library                       | Introducing a unified, multi-modal Raw Data Library backed by PostgreSQL for structured and unstructured data. | draft      | [View](openspec/changes/raw-data-library)                       |
| remove-inspire-radio                   | Completing the removal of the InspiringRadioWidget component and its tests.                                    | draft      | [View](openspec/changes/remove-inspire-radio)                   |
| test-coverage-expansion                | Introducing a comprehensive suite of unit tests for the visual knowledge store and whiteboard UI.              | draft      | [View](openspec/changes/test-coverage-expansion)                |
| test-coverage-expansion-phase2         | Introducing new unit and integration tests for hooks, utility functions, and React components.                 | draft      | [View](openspec/changes/test-coverage-expansion-phase2)         |
| testing-architecture-modernization     | Modernizing the testing architecture by shifting to the Testing Trophy methodology.                            | draft      | [View](openspec/changes/testing-architecture-modernization)     |

<!-- OPENSPEC_TABLE_END -->

## 📈 Recent Momentum

<!-- GIT_HISTORY_START -->

- **feat**: Implement Unified Ideation Engine and Strategy Toolbox components
- **feat**: Upgrade roadmap extraction and drift detection using `gemini-3.1-pro-preview`
- **feat**: Enrich roadmap extractor to act as a multi-domain tech strategist with 2026 market context
- **feat**: Implement ML-powered doc drift detector
- **feat**: Scaffold OpenSpec for ideation workflow
- **feat**: Update docs, UI, and OpenSpec with UX/DX review focusing on user value prop
- **fix**: Run roadmap extractor on docs/plans in lefthook and resolve type errors
- **docs**: Add `product-vision.mdc` cursor rule for global context
- **docs**: Extract future wow features using new roadmap extractor on docs/plans and specs
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

We welcome contributions! Please refer to our detailed **[CONTRIBUTING.md](CONTRIBUTING.md)** guide before starting any feature work. It covers:

- Our mandatory OpenSpec feature planning workflow.
- Conventional Commits enforced by Lefthook.
- Testing, Squashing, and Merging PR policies.
- Automated semantic versioning and manual release workflows.
