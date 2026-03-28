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
<!-- OPENSPEC_TABLE_END -->

## 📈 Recent Momentum

<!-- GIT_HISTORY_START -->
<!-- GIT_HISTORY_END -->

## 🎯 Sprint Insights & Tech Debt

<!-- TECH_DEBT_START -->
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
