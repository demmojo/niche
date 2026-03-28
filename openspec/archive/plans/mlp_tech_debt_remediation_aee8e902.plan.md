---
name: MLP Tech Debt Remediation
overview: A comprehensive remediation plan to eliminate extreme over-engineering (Piscina threads, manual vector math), extract fat controllers (campaignRoutes.ts), secure frontend transactions, and modernize testing/React 19 patterns to achieve a Series A-ready Minimum Lovable Product.
todos:
  - id: arch-queues
    content: "Consolidate async compute: Remove Piscina thread pools, SharedArrayBuffer, and rogue setIntervals; standardize on BullMQ."
    status: pending
  - id: arch-controllers
    content: "De-fat controllers: Extract vector math and LLM logic from campaignRoutes.ts into a VectorScoringService."
    status: pending
  - id: arch-security
    content: "Secure mutations: Move runTransaction calls from React frontend components to backend API endpoints."
    status: pending
  - id: express-errors
    content: "Modernize Express 5: Remove repetitive try/catch wrappers and implement a global async error handler (incl. 413 payloads)."
    status: pending
  - id: react-async
    content: "Fix React 19 transitions: Correct detached setTimeout inside startTransition in ValidationArena.tsx and utilize isPending natively."
    status: pending
  - id: test-mocks
    content: "Modernize tests: Replace deep firebase-admin mocks with Firebase Emulator and global.fetch with msw in campaignRoutes.test.ts."
    status: pending
  - id: tech-types
    content: "Fix typing anti-patterns: Remove 'any' casts in scoringRoutes.ts and resolve detached dynamic imports in hot paths."
    status: pending
  - id: arch-telemetry
    content: "Remove rogue telemetry: Clean up hanging local fetch calls in authMiddleware.ts and simplify BYOK cookie encryption."
    status: pending
  - id: competitor-discovery-refactor
    content: "Refactor /discover-competitors: Extract Exa and Gemini logic from campaignRoutes.ts to a dedicated service, fix dynamic imports, apply sanitizeUserInput, and enforce withInstruCoT."
    status: pending
isProject: false
---

# NicheAI Tech Debt & Architecture Remediation Plan

Based on a comprehensive review by the architecture, framework, and best-practices subagents, the NicheAI codebase currently suffers from "Enterprise-grade" over-engineering that is detrimental to the agility of an MLP.

This plan addresses severe fat controllers, rogue threading/polling, leaked frontend transactions, and outdated testing paradigms.

## Enhancement Summary

**Deepened on:** 2026-03-28
**Sections enhanced:** 4
**Research agents used:** `architecture-strategist`, `best-practices-researcher`, `framework-docs-researcher`

### Key Improvements

1. **Simplified Worker Processors:** Explicit strategy to replace Piscina with BullMQ's standard worker threads, avoiding the overhead of sandboxing for a lean MLP.
2. **Asynchronous Job Queue Pattern:** Concrete roadmap for returning `202 Accepted` on heavy LLM routes and letting clients subscribe to Firestore.
3. **React 19 Nested Transitions:** Addressed the "async tearing" pitfall in React 19 by enforcing nested `startTransition` calls post-await.
4. **Intent-Based Emulator Cleansing:** Clear actionable testing standards utilizing the Firebase Emulator REST API for blazing-fast test isolation, fully supporting parallel Vitest runners with an 80-100% coverage mandate.
5. **Architectural Simplicity & Security:** Extracted "God" services into cohesive modules, enforced AuthZ boundaries and Zod schema validation on transactions, and fixed critical concurrency race conditions regarding vector math memory pooling.
6. **Cost & Tech Alignment:** Re-aligned web scraping to prefer Gemini Flash over paid external APIs where possible, and strictly standardized on Gemini 768D embeddings.

## 1. Architecture & Queue Consolidation

- **Remove Piscina & `SharedArrayBuffer`**: The K-Means clustering in `src/workers/kmeansWorker.ts` and `tarpitFlywheel.ts` violates core architectural rules by using C-style shared memory. Shift to standard asynchronous BullMQ workers.
- **Remove Rogue Polling**: Delete the `setInterval` Firestore polling loop in `src/server/queues.ts` and replace it with a native BullMQ scheduled job.
- **Remove Hypothetical Infrastructure**: Strip out premature Supabase/Postgres references in `distillationQueue` to focus strictly on the current Firestore architecture.

### Research Insights: Queue Migration

**Best Practices:**

- Use standard BullMQ processors. Avoid `useWorkerThreads: true` and sandboxed processors as they introduce unnecessary build complexities for an MLP. If the event loop blocks, deploy a standard worker container instead.
- Enforce **Strict Job Ingress Validation** by passing all `job.data` through a Zod schema at the top of the processor function.

**Performance Considerations:**

- Hardcode a sane default concurrency (e.g., `concurrency: 5`) and rely on bounded concurrency. Dynamically tuning via `os.cpus()` is an anti-pattern in containerized deployments.
- Ensure all BullMQ `ioredis` connections explicitly set `maxRetriesPerRequest: null`.
- Worker-side Data Hydration: Push lightweight job metadata to Redis, and fetch heavy vectors from the database _inside_ the worker thread to offload JSON parsing overhead.

**Implementation Details:**

```typescript
// src/server/workers/kmeansProcessor.ts
import { Worker } from "bullmq";

export const startTarpitClusteringWorker = () => {
  return new Worker(
    "tarpit-clustering",
    async (job) => {
      const { limit, k } = JobDataSchema.parse(job.data);
      // Fetch vectors here, allocate memory per-request, and process...
    },
    { concurrency: 5, connection },
  );
};
```

## 2. API & Routing Refactoring

- **Extract Fat Controllers**: `src/server/campaignRoutes.ts` is ~1,200 lines long. Split the "God" service logic into cohesive domain modules: `llmProvider.ts`, `marketIntelligence.ts`, and `vectorMath.ts`. Prefer Gemini Flash for web scraping/data extraction over paid external APIs like Firecrawl to minimize costs.
- **Refactor `/discover-competitors`**:
  - Extract `fetchExaCompetitors` and inline Gemini prompt logic into a dedicated service (e.g., `src/services/competitorDiscoveryService.ts`).
  - **Fix Dynamic Imports**: Move `const { withModelFallback } = await import("../utils/aiClient");` out of the request handler to be a static import at the top of the file.
  - **Enhance Zod Validation**: Replace the hacky `.refine()` type assertions on `CampaignRequestSchema` with discriminated unions. Enforce strict `withInstruCoT` (from `src/utils/zodSecurity.ts`) on the LLM schemas to mathematically defend against prompt injection.
  - **Prevent Prompt Injection**: Apply the newly created `sanitizeUserInput` from `src/utils/security.ts` on `baseIdea` before injecting it into the Gemini prompt template.
  - **Remove `any` types**: Replace `any` typings on Exa and LLM responses with strict TS interfaces. Ensure the fallback catch block gracefully handles missing values.
- **Remove Rogue Telemetry**: Delete synchronous `fetch('http://127.0.0.1:7755...')` calls in `src/server/authMiddleware.ts` and `campaignRoutes.ts` that will hang production.
- **Secure Firestore Transactions**: Remove `runTransaction` from React components (e.g., `GuidedBrandWizard.tsx`, `StrategyToCodeWizard.tsx`). Move these complex data mutations to dedicated backend endpoints. Mandate Authorization (AuthZ) checks inside the transaction, and strict Zod validation on request payloads.
- **Standardize Firebase Admin**: Remove hacky inline CJS/ESM interop (`const admin: typeof adminNamespace = ...`) from route files and manage it in a central initialized module.

### Research Insights: API Architecture

**Best Practices:**

- Adopt the **Asynchronous Job Queue pattern** for LLM generation: the controller immediately returns a `202 Accepted` with a `jobId`, and the client subscribes via Firestore `onSnapshot`.
- Secure backend transactions using **SCD Type 2 Append-Only** writes to preserve historical data. Apply explicit Authorization (`doc.data().userId !== req.user.uid`) to prevent IDOR vulnerabilities.
- LLM Security: Sanitize all inputs (e.g., `replace(/[<>]/g, '')`) before passing them to the Gemini API to mitigate Prompt Injection.
- Ensure API keys are strictly managed via `.env` files and never hardcoded in any newly refactored services.

**Performance Considerations:**

- **CRITICAL CONCURRENCY FIX:** Do _not_ use static or shared module-scoped `Float32Array` scratchpads for vector math, as Node.js handles requests concurrently on the event loop. Instantiating a new `Float32Array(768)` _per-request_ is mandatory to prevent cross-request data corruption. The V8 GC easily handles 3KB arrays.

**Implementation Details:**

```typescript
// vectorMath.ts
const DIMENSIONS = 768; // Enforce Gemini 768D embedding format

// Function is pure, array is instantiated per execution
export function calculateCosineSimilarity(
  vecA: number[],
  vecB: number[],
): number {
  const scratchpad = new Float32Array(DIMENSIONS);
  // Branchless Math.max cmov optimization here
}
```

## 3. Framework Modernization (React 19 & Express 5)

- **Fix `useTransition` Anti-patterns**: In `src/components/ValidationArena.tsx`, fix the detached `setTimeout` inside `startTransition` by converting it to an `async` transition, and properly utilize the `isPending` state for UI feedback.
- **Global Express Error Handling**: Remove legacy `try { ... } catch (e) { res.status(500) }` boilerplate across all `*Routes.ts`. Rely on Express 5's native async error bubbling and implement a global middleware to handle Zod validation errors and `413 Entity Too Large` body-parser errors.

### Research Insights: Framework Standards

**Best Practices:**

- Express 5 automatically forwards async promise rejections to the global error handler (`app.use((err, req, res, next) => {...})`). Remove all `express-async-handler` wrappers.
- Set granular payload limits. Use a strict global default (e.g., `express.json({ limit: '100kb' })`), and only increase it to `1mb` on specific heavy routes to prevent DoS resource exhaustion.
- In React 19, `startTransition` natively accepts an `async` function. The `isPending` state remains `true` automatically until the Promise resolves.

**Edge Cases & Pitfalls:**

- **React Async Tearing:** State updates executing _after_ an `await` inside a transition lose context. You must wrap the post-await state update in a nested `startTransition(() => setState(...))`.
- **Express 413 Errors:** When payload limits are breached, `body-parser` throws an error with `type: 'entity.too.large'`. The global error handler must explicitly catch this to return a structured JSON response instead of crashing into a raw HTML trace.

## 4. Testing & Type Safety

- **Intent-Based Testing Compliance**: In `src/__tests__/server/campaignRoutes.test.ts`, remove brittle 60+ line `firebase-admin` internal mocks and enforce global usage of the Firebase Emulator Suite.
- **Coverage Mandate**: Ensure 80-100% test coverage using `@vitest/coverage-v8` on all refactored modules.
- **Network Mocking**: Replace `global.fetch` overrides for Turnstile CAPTCHA with `msw` (Mock Service Worker).
- **Type Safety**: Replace `any` typings in `src/server/scoringRoutes.ts` with the correct `AuthenticatedRequest`, and remove detached dynamic imports (`import().then()`) occurring in the hot path.

### Research Insights: Robust Testing

**Best Practices:**

- Route the `firebase-admin` SDK to the local emulator via `process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'`.
- Generate a randomized Firebase Project ID per test file (`process.env.GCLOUD_PROJECT = 'test-' + randomUUID()`) so parallel Vitest runs do not leak state or randomly clear each other's data.
- Clear the emulators completely in `afterEach` via the Firebase REST API `DELETE /emulator/v1/projects/{projectId}/...` to ensure complete test isolation.
- MSW v2: Mock network edges using MSW in "strict mode" (`onUnhandledRequest: 'error'`) so that any unmocked external requests instantly fail the test.

**Implementation Details:**

```json
// package.json scripts
"test:integration": "firebase emulators:exec 'vitest run'"
```

```typescript
// vitest.setup.ts
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  // Clear Firebase emulator via REST API
});
```
