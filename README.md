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

> **Note:** For a deep dive into our product philosophy, business model, and architectural constraints, please review our [Master Context Document](docs/nicheai-master-context.md) and the `docs/strategy/` directory.

<!-- OPENSPEC_TABLE_START -->

| Feature                                | Summary                                                                                                                            | Status      | Link                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------- |
| ast-driven-drift-healing               | We will transform documentation drift detection into a proactive, self-healing Strategic Sprint Engine.                            | draft       | [View Spec](openspec/changes/ast-driven-drift-healing)               |
| brand-positioning-wizard               | We are introducing a Brand Identity & Positioning Wizard.                                                                          | implemented | [View Spec](openspec/changes/brand-positioning-wizard)               |
| bug-hunt-test-review                   | Implement rigorous testing standards across the repository.                                                                        | superseded  | [View Spec](openspec/changes/bug-hunt-test-review)                   |
| cloudflare-deployment-analytics-engine | Currently, our application relies on mocked frontend and backend components.                                                       | draft       | [View Spec](openspec/changes/cloudflare-deployment-analytics-engine) |
| codebase-test-quality-review           | A comprehensive, structured review of the entire NicheAI codebase to discover latent bugs and improve test quality.                | draft       | [View Spec](openspec/changes/codebase-test-quality-review)           |
| deduplication-algorithm                | We are formalizing a Tri-Tiered Waterfall Matching Strategy to identify related raw data.                                          | superseded  | [View Spec](openspec/changes/deduplication-algorithm)                |
| exa-api-key-fallback                   | We are introducing a secondary Exa API key to be used as a fallback in our code.                                                   | draft       | [View Spec](openspec/changes/exa-api-key-fallback)                   |
| head-to-head-comparison                | Introducing a Head-to-Head Comparison view.                                                                                        | draft       | [View Spec](openspec/changes/head-to-head-comparison)                |
| hitl-feature-merging                   | We are introducing a Human-in-the-Loop (HITL) merging system.                                                                      | draft       | [View Spec](openspec/changes/hitl-feature-merging)                   |
| hybrid-scoring-tarpit-flywheel         | We are replacing stochastic LLM "vibes" with a mathematically rigorous Hybrid Scoring Engine.                                      | draft       | [View Spec](openspec/changes/hybrid-scoring-tarpit-flywheel)         |
| image-import                           | The UploadDataModal will be extended to accept image files.                                                                        | superseded  | [View Spec](openspec/changes/image-import)                           |
| inject-brand-identity-prompt           | Add a pure function to format and append the ProjectBrandIdentity to prompts.                                                      | implemented | [View Spec](openspec/changes/inject-brand-identity-prompt)           |
| multi-category-mentions                | A real-time, multi-category autocomplete mention system will be introduced into the chat interface.                                | draft       | [View Spec](openspec/changes/multi-category-mentions)                |
| mvp-analytics-superadmin               | Replace the over-engineered Recharts visualizations with a Magic Login table and a daily Generation Count metric.                  | draft       | [View Spec](openspec/changes/mvp-analytics-superadmin)               |
| navbar-logical-ordering                | The sidebar navigation items will be reordered and grouped logically to reflect a workflow-based navigation pattern.               | draft       | [View Spec](openspec/changes/navbar-logical-ordering)                |
| next-gen-analytics                     | We are introducing the Next-Gen Analytics Platform.                                                                                | superseded  | [View Spec](openspec/changes/next-gen-analytics)                     |
| performance-optimization               | This change introduces aggressive code-splitting for large feature components and defers loading of heavy AI SDKs.                 | draft       | [View Spec](openspec/changes/performance-optimization)               |
| proactive-market-analysis              | Introduce a progressive sync banner that displays real-time background task progress without blocking the chat.                    | draft       | [View Spec](openspec/changes/proactive-market-analysis)              |
| rapid-pdlc-prompt-exporter             | We are introducing a Rapid PDLC Workflow (Strategy to Code) feature.                                                               | implemented | [View Spec](openspec/changes/rapid-pdlc-prompt-exporter)             |
| raw-data-image-storage                 | We are introducing persistent cloud storage for user-uploaded images using Supabase Storage.                                       | draft       | [View Spec](openspec/changes/raw-data-image-storage)                 |
| sanitize-system-logs                   | Hide the View Context Data and View Response Details sections in the System Logs UI for non-superadmin users.                      | draft       | [View Spec](openspec/changes/sanitize-system-logs)                   |
| smart-llm-routing                      | We are introducing an Auto (Smart Routing) mode as the default behavior.                                                           | superseded  | [View Spec](openspec/changes/smart-llm-routing)                      |
| strategy-toolbox                       | Replacing the static, rigid Analytical Template Library with a dynamic, data-driven Strategy Toolbox.                              | superseded  | [View Spec](openspec/changes/strategy-toolbox)                       |
| supabase-integration                   | Adding team_id to raw_data_assets, raw_data_versions, and raw_data_inbox.                                                          | draft       | [View Spec](openspec/changes/supabase-integration)                   |
| superadmin-feature-controls            | Add a View-As Toggle in the Superadmin Dashboard to drop superadmin privileges temporarily.                                        | draft       | [View Spec](openspec/changes/superadmin-feature-controls)            |
| system-logs-ux                         | Map internal AI and search tool names to generic action labels in the UI.                                                          | draft       | [View Spec](openspec/changes/system-logs-ux)                         |
| test-coverage-and-quality              | Addition of comprehensive test suites using Vitest, React Testing Library, and MSW for newly modified UI components.               | draft       | [View Spec](openspec/changes/test-coverage-and-quality)              |
| test-coverage-quality                  | Comprehensive test suites for recently modified files using Vitest, React Testing Library, and MSW.                                | draft       | [View Spec](openspec/changes/test-coverage-quality)                  |
| test-coverage-tarpit-tollgate          | We will implement a non-brittle, comprehensive Boundary Testing Approach using Vitest, MSW, Supertest, and Playwright.             | draft       | [View Spec](openspec/changes/test-coverage-tarpit-tollgate)          |
| tooltip-activation-fix                 | Update the wrapper for SyncNowButton to tightly fit the button.                                                                    | draft       | [View Spec](openspec/changes/tooltip-activation-fix)                 |
| unified-ideation-and-evolution         | A complete overhaul of the initial onboarding and product ideation experience.                                                     | draft       | [View Spec](openspec/changes/unified-ideation-and-evolution)         |
| ai-model-fallback                      | We are introducing a unified AI client that wraps Gemini, OpenAI, and Anthropic SDKs.                                              | draft       | [View Spec](openspec/changes/ai-model-fallback)                      |
| analytical-template-system             | Introduce a unified Analytical Template System that routes users into two distinct flows.                                          | draft       | [View Spec](openspec/changes/analytical-template-system)             |
| architecture-performance-optimization  | Extract heavy subcomponents from App.tsx into separate files and push volatile state down the component tree.                      | draft       | [View Spec](openspec/changes/architecture-performance-optimization)  |
| comprehensive-documentation-update     | Update in-app guides, tooltips, onboarding modals, and help pages to reflect the current feature set and UI changes.               | draft       | [View Spec](openspec/changes/comprehensive-documentation-update)     |
| consolidate-features-modal             | Retroactive documentation of the Consolidate Features Modal feature.                                                               | superseded  | [View Spec](openspec/changes/consolidate-features-modal)             |
| data-export-generator                  | Introduce a Comprehensive Data Export & Documentation Generator feature across the application.                                    | superseded  | [View Spec](openspec/changes/data-export-generator)                  |
| data-sync-review                       | Introduce a universal Data Sync Review workflow to act as a gatekeeper for all external data pulls and AI-generated state updates. | draft       | [View Spec](openspec/changes/data-sync-review)                       |
| dev-workflow-and-cicd                  | Implementing lefthook for parallelized, high-performance local git hooks.                                                          | draft       | [View Spec](openspec/changes/dev-workflow-and-cicd)                  |
| developer-onboarding-docs              | Our current developer documentation needs to be enhanced to ensure smooth onboarding.                                              | proposed    | [View Spec](openspec/changes/developer-onboarding-docs)              |
| documentation-wizard                   | Introduces the DocumentationWizardModal to generate and download system documentation.                                             | draft       | [View Spec](openspec/changes/documentation-wizard)                   |
| feature-videos                         | We are transitioning the feature video generation pipeline to an agent-browser.                                                    | superseded  | [View Spec](openspec/changes/feature-videos)                         |
| gemini-model-upgrade-routing           | Complete removal of legacy models, replacing them with the current state-of-the-art.                                               | draft       | [View Spec](openspec/changes/gemini-model-upgrade-routing)           |
| global-progress-banner                 | Introduces a GlobalProgressBanner component at the top of the application layout that listens to active tasks.                     | draft       | [View Spec](openspec/changes/global-progress-banner)                 |
| insight-brainstorm-chat                | Retroactive documentation of the Insight Brainstorm Chat feature.                                                                  | superseded  | [View Spec](openspec/changes/insight-brainstorm-chat)                |
| insight-generator-modal                | Retroactive documentation of the Insight Generator Modal feature.                                                                  | draft       | [View Spec](openspec/changes/insight-generator-modal)                |
| insight-quest-modal                    | We are documenting the implementation of the InsightQuestModal, a gamified A/B testing interface.                                  | draft       | [View Spec](openspec/changes/insight-quest-modal)                    |
| interactive-tour-guide                 | A custom, lightweight, React 19-compatible guided tour component powered by Framer Motion.                                         | draft       | [View Spec](openspec/changes/interactive-tour-guide)                 |
| market-analysis-features               | We are introducing a tabbed interface within the MarketAnalysis component.                                                         | draft       | [View Spec](openspec/changes/market-analysis-features)               |
| market-data-grid                       | Retroactive documentation of the Market Data Grid feature.                                                                         | superseded  | [View Spec](openspec/changes/market-data-grid)                       |
| market-value-notebook                  | Retroactive documentation of the Market Value Notebook feature.                                                                    | draft       | [View Spec](openspec/changes/market-value-notebook)                  |
| marketing-video-automation             | We are implementing Marketing Video Automation & Mock Data to streamline video generation.                                         | draft       | [View Spec](openspec/changes/marketing-video-automation)             |
| multi-product-and-teams                | Enhancing the existing product dropdown in the top navigation to support adding new products.                                      | draft       | [View Spec](openspec/changes/multi-product-and-teams)                |
| multiple-visual-whiteboards            | Users can create, name, and switch between multiple infinite-canvas whiteboards.                                                   | draft       | [View Spec](openspec/changes/multiple-visual-whiteboards)            |
| narrative-feature-videos               | We are upgrading the scripts to inject a highly-realistic, animated macOS-style SVG cursor.                                        | draft       | [View Spec](openspec/changes/narrative-feature-videos)               |
| raw-data-library                       | We are introducing a unified, multi-modal Raw Data Library backed by PostgreSQL.                                                   | draft       | [View Spec](openspec/changes/raw-data-library)                       |
| remove-inspire-radio                   | Complete removal of the InspiringRadioWidget component and its associated tests.                                                   | draft       | [View Spec](openspec/changes/remove-inspire-radio)                   |
| test-coverage-expansion                | We are introducing a comprehensive suite of unit tests for the visual knowledge store and whiteboard UI components.                | draft       | [View Spec](openspec/changes/test-coverage-expansion)                |
| test-coverage-expansion-phase2         | We are introducing new unit and integration tests for various hooks, utility functions, and React components.                      | draft       | [View Spec](openspec/changes/test-coverage-expansion-phase2)         |
| testing-architecture-modernization     | We are modernizing the testing architecture by shifting to the Testing Trophy methodology.                                         | draft       | [View Spec](openspec/changes/testing-architecture-modernization)     |

<!-- OPENSPEC_TABLE_END -->

## 📈 Recent Momentum

<!-- GIT_HISTORY_START -->

- **Feature**: Implemented Unified Ideation Engine and scaffolded workflows.
- **Feature**: Built ML-powered doc drift detector and roadmap extractor, upgraded to `gemini-3.1-pro-preview`.
- **Feature**: Implemented strategy toolbox components and ML updates.
- **Fix**: Integrated roadmap extractor into Lefthook pre-commit hooks.
- **Docs**: Comprehensive UX/DX documentation review and OpenSpec updates.
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

- **Local Authentication & E2E Testing:** If you specifically want to browse the application fully authenticated as the `mo.hassaniv@gmail.com` superadmin user without going through the UI:
  - The application has a built-in "Playwright E2E Test Mode" that mocks the authentication layer completely. You can trigger it by appending a query parameter to your URL.
  - Navigate to: `http://localhost:5173/?mock_auth=true` (or whichever port your local server is running on).
  - The application will instantly bypass the Firebase Authentication listeners and hardcode your session to:
    - **Email:** `mo.hassaniv@gmail.com`
    - **Role:** Superadmin
  - _(If you ever need to test what a regular user sees instead of the superadmin, you can use: `http://localhost:5173/?mock_auth=true&role=user`)_
- **API Rate Limits**: The AI clients (`aiClient.ts`, `geminiClient.ts`) handle `429` rate limits dynamically. Ensure you monitor the in-app Usage Tracker during extensive testing. If you exhaust a key, fallback mechanisms will attempt to use alternative models.
- **Firebase Sync Conflicts**: `useFirebaseSync` includes debounced logic and error trapping. If testing offline scenarios, rely on `firebase.ts` built-in offline persistence. Check console logs for `resource-exhausted` quotas.
- **Test State Leaks**: Tests are wrapped with `<VisualKnowledgeProvider>` in `src/test-utils/render.tsx` to isolate Zustand state. Ensure any new tests utilizing context-bound stores import `render` from `test-utils` rather than `@testing-library/react`.

---

## ☁️ Deployment (Cloud Run & Serverless)

The application is fully containerized and uses Terraform (Infrastructure as Code) for a strict **Scale-to-Zero** ($0 idle cost) architecture on Google Cloud Run. Background ML tasks use Google Cloud Tasks and a dedicated worker service.

### Phase 1: Local Prerequisites & GCP Bootstrapping

1. **Install Dependencies**: Ensure [Docker](https://docs.docker.com/get-docker/), [Google Cloud CLI (`gcloud`)](https://cloud.google.com/sdk/docs/install), and [Terraform](https://developer.hashicorp.com/terraform/downloads) are installed.
2. **Create a GCP Project**: Go to the Google Cloud Console and create a new project.
3. **Enable Billing**: **CRITICAL:** You must attach an active billing account to the GCP project. Scale-to-zero is virtually free, but the APIs require a billing method.
4. **Firebase Configuration**: Create a Firebase project and enable **Firestore in Native Mode** (Warning: This choice is permanent).
5. **Enable APIs**:
   ```bash
   gcloud services enable run.googleapis.com \
     artifactregistry.googleapis.com \
     cloudtasks.googleapis.com \
     cloudscheduler.googleapis.com \
     secretmanager.googleapis.com \
     cloudbuild.googleapis.com
   ```

### Phase 2: Authentication & Local Config

1. **Authenticate gcloud**:
   ```bash
   gcloud auth login
   gcloud auth application-default login
   gcloud config set project YOUR_PROJECT_ID
   ```
2. **Environment Variables**: Create your local `.env` and `terraform/terraform.tfvars`:
   - Obtain your Firebase Admin SDK service account JSON. **Encode it in base64** to prevent Terraform parsing errors: `cat service-account.json | base64`
   - Set `terraform.tfvars`:
     ```hcl
     project_id                      = "YOUR_PROJECT_ID"
     region                          = "us-central1"
     gemini_api_key                  = "YOUR_GEMINI_API_KEY"
     firebase_project_id             = "YOUR_FIREBASE_PROJECT_ID"
     firebase_service_account_base64 = "YOUR_BASE64_ENCODED_JSON"
     ```

### Phase 3: Containerization

1. **Create Artifact Registry Repo**:
   ```bash
   gcloud artifacts repositories create nicheai-repo --repository-format=docker --location=us-central1
   ```
2. **Authenticate Docker**:
   ```bash
   gcloud auth configure-docker us-central1-docker.pkg.dev
   ```
3. **Build & Push**:
   > **🛑 APPLE SILICON WARNING:** If you are on an M-series Mac, you _must_ include `--platform linux/amd64` or Cloud Run will crash with an `exec format error`.
   ```bash
   docker buildx build --platform linux/amd64 -t us-central1-docker.pkg.dev/YOUR_PROJECT_ID/nicheai-repo/nicheai-app:latest .
   docker push us-central1-docker.pkg.dev/YOUR_PROJECT_ID/nicheai-repo/nicheai-app:latest
   ```

### Phase 4: Infrastructure as Code (Terraform)

Navigate to the `terraform/` directory and deploy:
_(Note: We strongly recommend configuring a GCS bucket for Terraform remote state for production.)_

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

### Appendix: Security & Architecture Patterns

To maintain a zero-friction, highly secure serverless architecture, NicheAI enforces the following rules:

- **OIDC Internal Routes**: The `worker` Cloud Run service is NOT public. Cloud Tasks attaches an OIDC token matching the `nicheai-cloudrun-sa` service account, which the worker verifies before executing any background job.
- **CPU Allocation Guarantee**: Cloud Run throttles CPU to 0 immediately upon returning a response. Internal worker endpoints **MUST `await` the entire background process and hold the HTTP request open**. Do not return `202 Accepted` early from a worker route.
- **The Claim Check Pattern**: Cloud Tasks enforces a strict 100KB payload limit. For heavy ML payloads (e.g., base64 images), the system offloads data to the `cloud_tasks_payloads` Firestore collection and passes `{ jobId, isHeavyPayload: true }` through the queue.
- **IAM Least Privilege**: The custom `nicheai-cloudrun-sa` service account acts strictly as an invoker and secret accessor.

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
