# NicheAI: Master Technical & Product Context

This document serves as the ultimate source of truth for NicheAI's technical architecture, boundaries, and product philosophy. It is specifically designed as a context payload for AI coding agents and engineering teams generating new features or OpenSpecs.

---

## 1. Product Philosophy & Vision

NicheAI is an autonomous market intelligence platform and AI product strategist. It serves a bifurcated audience: Solo Founders/Indie Hackers seeking guided validation workflows, and Enterprise Product Managers (PMs) requiring data-dense analytical dashboards. It solves the problem of "tarpit" ideas by providing real-time competitor data.

### Core Tenets

1.  **Niche over Horizontal:** Broad features are rejected. Every feature must force users into hyper-specific, defensible market segments.
2.  **Split UX Architecture:** NicheAI provides a "Pivot Simulator" (opinionated, guided wizards) for Solo Founders, and a "Command Center" (data-dense, analytical dashboards) for Enterprise PMs.
3.  **Human-in-the-Loop (HITL):** AI features must fail gracefully. Users must easily correct, edit, or reject AI outputs. There are no fully autonomous destructive actions.
4.  **Anti-Bloat MVP Budget:** Features must align with a lean timeline. Over-engineered meta-tooling is rejected.

---

## 2. System Architecture & Boundaries

NicheAI utilizes a modern, split-stack architecture optimized for asynchronous AI orchestration. The application relies on a multi-tier data architecture to handle distinct data types.

### The Frontend (React 19 / Vite / Tailwind v4)

- **Feature-Sliced Design:** Avoid "God Components." Volatile state (e.g., typing indicators) must be pushed deep down the component tree to prevent global re-renders.
- **State Management (Context-Bound Vanilla Zustand):** We do not use global Redux or standard Zustand stores for complex views. We create isolated, context-bound vanilla Zustand stores (e.g., per Whiteboard) to prevent state leakage between automated tests and ensure granular re-renders.

### The Backend (Express 5.x BFF)

- The Node.js/Express server acts as a Backend-For-Frontend (BFF). It proxies external APIs, handles rate limiting, and streams data back to the client via Server-Sent Events (SSE).
- **Controller Mandate:** Heavy handler logic, Apollo fetch loops, and LLM prompt mapping must be extracted out of the `server.ts` file and into isolated controllers inside `src/server/controllers/`.

### The Multi-Tier Data Architecture (Critical)

NicheAI uses Firebase, BigQuery, and Vertex AI. The boundary is strictly enforced:

1.  **Firebase Firestore (NoSQL):** The absolute Source of Truth for real-time state, user metadata, workspaces, and append-only taxonomies. All UI rendering relies on asynchronous `onSnapshot` listeners from Firestore.
2.  **BigQuery (Lineage Layer):** Maintains SCD Type 2 historical data lineage for raw SaaS data and quarantined hallucinations.
3.  **Vertex AI (Vector Layer):** Handles native vector search syncs. We explicitly do not use PostgreSQL/pgvector to avoid data silos.

---

## 3. AI Orchestration & The Asynchronous Task Plane

Long-running LLM operations (e.g., market scraping or generating OpenSpecs) must not block the main thread or force the user to stare at a loading spinner.

- **Asynchronous Job Queues:** Endpoints trigger background tasks explicitly via **GCP Cloud Tasks** and immediately return an HTTP `202 Accepted` with a `jobId`. The frontend listens for completion via the database.
- **Smart LLM Routing:** The system defaults to **Gemini 3.1 Pro** for deep reasoning tasks and **Gemini 3.1 Flash** for fast data extraction. Legacy models (Gemini 1.5, 2.5) are strictly avoided. **Gemini Search Grounding** is the exclusive mechanism for fetching organic search metrics (replacing legacy Programmable Search APIs).
- **Deterministic ML Execution:** In Node.js environments, avoid `SharedArrayBuffer` for synchronous logic. Rely on pre-allocated `Float32Array` scratchpads for deterministic execution when calculating similarity distances.

### Data Moat & Scraping Pipeline

NicheAI implements a Hyper-Scale SaaS Data Moat Pipeline with a strict two-tier hierarchy:

1.  **Primary (Fast/Cheap):** Static HTTP crawlers running on Cloud Run, explicitly targeting high-signal routes (`/careers`, `/changelog`, `/integrations`).
2.  **Fallback (Heavy/Costly):** Firecrawl via Cloud Tasks, triggered specifically when encountering 403/429 Bot Walls or SPAs.

### Security, Prompt Injection & Semantic Defense

- **LLM-as-a-Judge Pipeline:** Zod schemas validate syntax, but semantic hallucinations are caught by dedicated audits. We use Gemini 3.1 Pro to audit outputs and quarantine detected hallucinations directly into BigQuery before they reach the user or pollute the core databases.
- Data entering the LLM pipeline must be sanitized. External API responses are wrapped in strict XML tags (e.g., `<market_data>`) to separate instructions from payload.
- Outputs are strictly validated against Zod schemas (utilizing `z.discriminatedUnion`) to ensure the application does not crash on malformed JSON generated by the model.

---

## 4. Documentation Automation (CI/CD)

The documentation suite (including `docs/strategy/*`, `docs/ROADMAP.md`, and `README.md`) is kept synchronized with the codebase asynchronously.

- **GitHub Actions over Local Hooks:** We rigorously reject slow, LLM-driven generation scripts in local Git hooks (e.g., `pre-push`). Tools like `roadmap-extractor.ts` and `generate-docs.ts` are executed via `.github/workflows/sync-strategy.yml` on push to the main branch.
- **Git Identity:** Automated commits use the authorized `mo.hassaniv@gmail.com` identity.
