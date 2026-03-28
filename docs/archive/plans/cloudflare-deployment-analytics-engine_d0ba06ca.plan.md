---
name: cloudflare-deployment-analytics-engine
overview: Comprehensive architecture and implementation plan for the Cloudflare Pages (OpenNext) deployment pipeline, Web Analytics provisioning, and AI-driven Go-To-Market attribution engine.
todos: []
isProject: false
---

# OpenSpec: Cloudflare Deployment & AI Analytics Attribution Engine

## 1. Architecture Overview

To transition from the mocked frontend/backend to a production-grade deployment and analytics engine, we must implement a robust, asynchronous pipeline. Based on 2026 Cloudflare architectural best practices, Cloudflare is consolidating Pages into Workers; therefore, we will utilize **OpenNext on Cloudflare Workers** for Next.js deployments.

### System Components & Data Flow

1. **Credential Management (BYOK):** Cloudflare does not offer a public 3-legged OAuth marketplace for arbitrary SaaS platforms. Instead, we will utilize **Cloudflare API Token Template URLs**. The frontend generates a deep link pre-configured with the exact permission scopes required (Workers Scripts, Routes, KV Storage, and Web Analytics). The user authorizes the token in their Cloudflare dashboard and pastes it securely into NicheAI.
2. **Asynchronous Build & Deploy Pipeline:** Building Next.js applications requires significant compute (Webpack/Turbopack). When a user initiates a deployment, the Node.js backend (`server.ts`) will push a job to a background message queue (e.g., BullMQ or AWS SQS). A dedicated worker pulls the Validation Spec, provisions the Web Analytics site tag, injects the tag into a scaffolded React/Next.js codebase, builds via `@opennextjs/cloudflare`, and programmatically deploys via `wrangler`.
3. **Analytics Ingestion Engine:** The backend queries the Cloudflare GraphQL Analytics API (`rumPageloadEventsAdaptiveGroups`) on-demand or via a cron schedule to pull Real User Monitoring (RUM) metrics.
4. **AI-Driven GTM Analysis & Attribution:** The system correlates time-series traffic data with the `shipped_at` timestamps of product features. This combined context is passed to an LLM (Claude 3.5 Sonnet / Gemini 1.5 Pro) to generate a strategic performance summary and attribute ROI to specific feature releases.

---

## 2. Data Model Updates

We need to update the Supabase schema to support multiple products per user, strictly enforce the "deploy at most once" constraint, and track feature shipment timestamps for AI attribution.

### `products` Table

_Tracks the core product, deployment state, and Cloudflare credentials._

- `id` (uuid, primary key)
- `user_id` (uuid, foreign key to `auth.users`)
- `name` (text)
- `description` (text)
- `cloudflare_account_id` (text)
- `cloudflare_api_token` (text, encrypted at rest)
- `deployment_status` (enum: `unprovisioned`, `queued`, `building`, `deployed`, `failed`)
- `deployed_url` (text, nullable)
- `cloudflare_site_tag` (text, nullable) - _The RUM JS snippet ID_
- `deployed_at` (timestamp, nullable) - _Enforces the "at most once" deployment constraint. If not null, deployment is locked._

### `product_features` Table

_Tracks individual features and their lifecycle for GTM attribution._

- `id` (uuid, primary key)
- `product_id` (uuid, foreign key to `products.id`)
- `name` (text)
- `status` (enum: `planned`, `in-progress`, `completed`)
- `shipped_at` (timestamp, nullable) - _Automatically set when status changes to `completed`. Critical for AI correlation._

### `gtm_metrics_snapshots` Table (Optional but recommended for caching)

_Caches Cloudflare GraphQL data to prevent rate-limiting and enable historical trend analysis._

- `id` (uuid, primary key)
- `product_id` (uuid, foreign key to `products.id`)
- `timestamp` (timestamp)
- `page_views` (int)
- `unique_visitors` (int)
- `conversion_rate` (float)

---

## 3. API Contracts

The following real endpoints will replace the current mocks in `server.ts`.

### `POST /api/cloudflare/connect`

**Purpose:** Validates and stores the user's BYOK Cloudflare API token.
**Payload:** `{ productId: string, accountId: string, apiToken: string }`
**Action:** Encrypts the token and updates the `products` table. Returns success.

### `POST /api/cloudflare/deploy`

**Purpose:** Initiates the OpenNext deployment pipeline.
**Payload:** `{ productId: string }`
**Action:**

1. Validates `deployment_status` and `deployed_at`. If `deployed_at` is set, reject (400 Bad Request) to enforce "at most once".
2. Updates `deployment_status` to `queued`.
3. Provisions Web Analytics via `POST /client/v4/accounts/{account_id}/rum/site_info` to get the `site_tag`.
4. Enqueues the background build job (generates Next.js code -> runs OpenNext build -> runs `wrangler deploy`).
   **Returns:** `{ jobId: string, status: "queued" }`

### `POST /api/cloudflare/graphql`

**Purpose:** Fetches RUM traffic metrics.
**Payload:** `{ productId: string, dateRange: { start: ISO8601, end: ISO8601 } }`
**Action:** Uses the stored `cloudflare_api_token` to execute a GraphQL query against `https://api.cloudflare.com/client/v4/graphql` targeting the `rumPageloadEventsAdaptiveGroups` dataset.
**Returns:** `{ pageViews: number, uniqueVisitors: number, conversionRate: string, referrers: string[] }`

### `POST /api/gtm/analyze`

**Purpose:** Executes the AI-Driven GTM Analysis & Attribution.
**Payload:** `{ productId: string, dateRange: { start: ISO8601, end: ISO8601 } }`
**Action:** Fetches metrics from Cloudflare GraphQL and `shipped_at` timestamps from `product_features`. Triggers the LLM evaluation.
**Returns:** `{ summary: string, strategy: string, actionPoints: string[], featureAttribution: Object }`

---

## 4. AI Prompt Architecture

To accurately attribute GTM metric shifts to product changes, the LLM requires a highly structured prompt and context payload.

### System Prompt

> You are an elite Go-To-Market (GTM) Strategist and Product Data Analyst. Your objective is to analyze time-series web traffic metrics alongside product feature release timelines. You must identify correlations between shipped features and traffic spikes/drops, summarize overall performance, and provide highly actionable strategic next steps to improve the Visitor-to-Lead conversion rate.

### Context Payload (JSON)

```json
{
  "product": {
    "name": "Acme Analytics",
    "description": "AI-powered CRM for independent dog walkers."
  },
  "metrics": {
    "dateRange": "2026-03-20 to 2026-03-27",
    "totalPageViews": 1250,
    "totalUniqueVisitors": 840,
    "averageConversionRate": 5.2,
    "dailyTimeSeries": [
      { "date": "2026-03-20", "views": 100, "visitors": 80 },
      { "date": "2026-03-23", "views": 450, "visitors": 300 }
    ]
  },
  "shippedFeatures": [
    { "name": "Dark Mode", "shipped_at": "2026-03-22T14:00:00Z" },
    { "name": "One-Click Onboarding", "shipped_at": "2026-03-25T09:00:00Z" }
  ]
}
```

### Response Schema (Enforced via JSON Mode)

```json
{
  "summary": "High-level overview of the traffic trends and conversion health.",
  "strategy": "The overarching approach to improve distribution and conversion in the next 7 days.",
  "actionPoints": ["Actionable step 1", "Actionable step 2"],
  "featureAttribution": [
    {
      "featureName": "Dark Mode",
      "impactAnalysis": "Traffic spiked by 350% the day after this release, indicating strong reception from the existing waitlist.",
      "confidenceScore": 0.85
    }
  ]
}
```

---

## 5. Sequential Execution Plan

These tasks should be placed in `openspec/changes/cloudflare-deployment/tasks.md` and executed sequentially by the AI coding agent.

- [ ] **1. Data Model & Migrations**
  - [ ] 1.1 Create Supabase SQL migrations to update the `products` table with Cloudflare credential fields, deployment tracking (`deployed_at`), and `cloudflare_site_tag`.
  - [ ] 1.2 Update the `product_features` table to include the `shipped_at` timestamp. Ensure backend logic sets this timestamp automatically when a feature's status changes to `completed`.

- [ ] **2. Cloudflare API Integration**
  - [ ] 2.1 Implement `POST /api/cloudflare/connect` in `server.ts` to securely receive, validate, and encrypt the Cloudflare API token.
  - [ ] 2.2 Implement the Cloudflare RUM provisioning logic via `fetch` to `https://api.cloudflare.com/client/v4/accounts/{account_id}/rum/site_info` to retrieve the `site_tag`.
  - [ ] 2.3 Implement `POST /api/cloudflare/graphql` in `server.ts` to query `rumPageloadEventsAdaptiveGroups` dynamically based on the stored token and account ID.

- [ ] **3. OpenNext Deployment Engine**
  - [ ] 3.1 Setup a background queue system (e.g., BullMQ or simple Node `EventEmitter` for local testing) to handle long-running deployment jobs.
  - [ ] 3.2 Implement the build logic: generate Next.js boilerplate, inject the `site_tag` into `layout.tsx`, and execute `npx @opennextjs/cloudflare build` using `execa`.
  - [ ] 3.3 Implement the deployment logic: execute `npx wrangler deploy` programmatically using the decrypted API token.
  - [ ] 3.4 Implement the strict "at most once" validation check against the `deployed_at` field in the `POST /api/cloudflare/deploy` endpoint.

- [ ] **4. AI GTM Analytics Attribution**
  - [ ] 4.1 Implement `POST /api/gtm/analyze` in `server.ts` to aggregate GraphQL metrics and `shipped_at` feature timestamps.
  - [ ] 4.2 Integrate the AI client (`utils/aiClient.ts`) using the defined Prompt Architecture and JSON schema validation.

- [ ] **5. Frontend Wiring**
  - [ ] 5.1 Update `DeploymentWizardModal.tsx` to display the API Token Template URL deep link, accept the token input, and call `POST /api/cloudflare/connect`.
  - [ ] 5.2 Wire the `DeploymentWizardModal.tsx` deploy button to `POST /api/cloudflare/deploy` and poll the job status.
  - [ ] 5.3 Update `FakeDoorMetrics.tsx` to fetch from the real GraphQL endpoint and add a new UI section to trigger and display the AI-Driven GTM Analysis & Attribution results.
