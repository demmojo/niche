---
name: test-coverage-expansion
overview: Scaffold the test-coverage-expansion OpenSpec and define architectural refactoring to enforce 80% intent-based and branch coverage using Vitest, RTL, MSW, and Firebase Emulators.
todos:
  - id: create-openspec-scaffold
    content: Scaffold the `test-coverage-expansion` directory structure based on `create-openspec` workflow.
    status: pending
  - id: update-vitest-config
    content: Update `vitest.config.ts` to enforce 80% coverage thresholds using the `v8` provider.
    status: pending
  - id: global-teardown
    content: Enforce strict Firebase Emulator global teardowns (`terminate()`, `deleteApp()`) inside `src/setupTests.ts` to prevent Vitest memory leaks, including environment guards.
    status: pending
  - id: pure-stream-parsers
    content: Refactor LLM stream parsing in `src/utils/SafeJsonStream.ts` into pure deterministic functions and write `fast-check` property tests.
    status: pending
  - id: msw-unhappy-paths
    content: Implement MSW-driven tests for network edge cases (500 errors, loading states, empty responses) using RTL's `userEvent`.
    status: pending
  - id: firebase-permissions
    content: Write Firebase Rules Unit Tests to hit `permission-denied` branches for unauthorized writes.
    status: pending
isProject: false
---

# Plan: Increase Test Coverage to 80%

## Enhancement Summary

**Deepened on:** 2026-03-28
**Sections enhanced:** 3
**Research agents used:** `architecture-strategist`, `best-practices-researcher`, `framework-docs-researcher`, `kieran-typescript-reviewer`, `julik-frontend-races-reviewer`, `code-simplicity-reviewer`, `data-integrity-guardian`, `performance-oracle`

### Key Improvements

1. **Direct Emulator Integration for Backend:** Ensure backend routes (`src/server/*Routes.ts`) are tested directly against the Firebase Emulator, avoiding over-engineered Dependency Injection/Hexagonal Architecture to preserve NicheAI's "Minimum Lovable Product" (MLP) philosophy and keep transaction boundaries (`runTransaction`) intact.
2. **Dynamic Project IDs for Test Isolation:** Prevented Vitest parallel-execution data collisions by isolating Firebase Emulators using `crypto.randomUUID()` and `memoryLocalCache()`.
3. **Vitest 3 & React 19 Safety:** Addressed specific bugs related to `vi.useFakeTimers()` OOM freezes with MSW, and updated Vitest 3 coverage threshold structures.
4. **Security Hardening:** Added strict `NODE_ENV === 'test'` guards on teardown scripts to prevent accidental data wipes outside test environments, and enforce Zod validation across all route layers to prevent Mass Assignment vulnerabilities.

### New Considerations Discovered

- _YAGNI Violation Prevented:_ Removed the meta-tooling bloat (Stochastic Evaluation LLM CI layer). Tests must be deterministic to protect CI execution speed and costs.
- _"Snapshot Beats the Fetch" Mitigation:_ Simulated testing is not enough; the plan now includes fixing the race conditions with explicit state machines/Correlation IDs and strict timeouts.

## Context & Approach

To achieve a reliable >80% branch and intent-based coverage for NicheAI without introducing flaky tests, we must streamline our test integrations. Based on the insights from our specialized research subagents (testing best practices, framework docs, and architecture strategy) and Exa search:

- **Intent-Based Frontend Testing:** We will test "Unhappy Paths" (e.g., 500 MSW errors, loading states, "Snapshot Beats the Fetch" race conditions) using React Testing Library (`userEvent.setup()`, `getByRole`) and Mock Service Worker (MSW). We will not mock the Firebase SDK directly.
- **Backend Testability:** We will keep Firebase coupled to `src/server/*Routes.ts` business logic but rely entirely on the Firebase Emulator for integration testing. This avoids massive YAGNI violations while maintaining strong transaction boundaries.
- **Pure Functions:** LLM stream parsers (`SafeJsonStream.ts`) will be made purely deterministic, allowing property-based testing (`fast-check`).
- **Vitest & Firebase Rigor:** We will enforce an 80% branch coverage threshold in Vitest (`v8` provider) and implement rigorous `globalThis.firestoreInstance.terminate()` teardowns in `src/setupTests.ts` to prevent memory leaks.

### Research Insights

**Best Practices:**

- Use MSW 2.x standard `HttpResponse` format instead of the deprecated `(req, res, ctx)` resolver syntax.
- `useFakeTimers()` in RTL must be configured with `userEvent` explicitly: `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })`.
- Do not use `as any` in tests. Rely strictly on `satisfies` and factory functions.

**Performance Considerations:**

- Using `fast-check` property tests slows down suites. Set `{ numRuns: process.env.CI ? 100 : 10 }` to protect TDD speed.
- Using a global static `demo-nicheai-test` database blocks Vitest parallelism and deleting records per-test causes I/O bottlenecks. Isolate data by suite.

**Edge Cases:**

- _React 19 Concurrent Rendering + Firebase:_ `onSnapshot` listeners can leak memory if React 19 test components aren't forcefully cleaned up. Mandate `cleanup()` before Firebase resets.
- _Vitest 3 `useFakeTimers` + MSW Bug:_ Mixing these can cause indefinite Vitest freezes or V8 OOM crashes. You MUST call `vi.runOnlyPendingTimers()` and `vi.useRealTimers()` in `afterEach` to prevent timer bleeding across tests.

## OpenSpec Generation

I will scaffold a new OpenSpec under `openspec/changes/test-coverage-expansion` using the `/create-openspec` workflow. The directory will contain:

### 1. `openspec/changes/test-coverage-expansion/.openspec.yaml`

```yaml
schema: spec-driven
status: draft
learnings_extracted: false
created: 2026-03-28
```

### 2. `openspec/changes/test-coverage-expansion/proposal.md`

Outlines the goal of hitting 80% branch coverage through intent-based testing, preventing production regressions during refactors.

### 3. `openspec/changes/test-coverage-expansion/design.md`

Focuses on:

- **Decisions:** Direct Express to Firebase Emulator integration (no DI bloat), MSW for API mocking on the frontend, Dynamic test project IDs for parallel runs.
- **Trade-offs:** Emulators can be slow; mitigated by pushing 65% of coverage to pure unit tests (zero emulators) and isolating emulator tests.

### 4. `openspec/changes/test-coverage-expansion/specs/test-coverage-expansion/spec.md`

Details the Gherkin `WHEN/THEN` scenarios for missing branches (e.g., "WHEN the API returns 500, THEN the UI renders an Explainable Error State").

### 5. `openspec/changes/test-coverage-expansion/tasks.md`

Sequenced tasks following Two-Step Red/Green Prompting, grouped by config updates, backend refactoring, property testing, and frontend intent tests.

## Essential Code Snippets

### Research Insights

**Enforcing 80% Coverage in `vitest.config.ts` (Vitest v3 Syntax):**

```typescript
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      ignoreEmptyLines: true,
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
```

**Firebase Emulator Dynamic Isolation & Secure Teardown (`test-utils/firebase-setup.ts`):**

```typescript
import { initializeApp, deleteApp } from "firebase/app";
import {
  initializeFirestore,
  memoryLocalCache,
  terminate,
} from "firebase/firestore";
import crypto from "crypto";

if (process.env.NODE_ENV !== "test") {
  throw new Error(
    "SECURITY FAULT: Emulator setup loaded outside of test environment.",
  );
}

// Isolate DB per worker to unblock Vitest parallelism
const poolId = encodeURIComponent(
  process.env.VITEST_POOL_ID || crypto.randomUUID(),
);
export const testProjectId = `demo-nicheai-test-${poolId}`;

export const app = initializeApp({ projectId: testProjectId });
export const db = initializeFirestore(app, { localCache: memoryLocalCache() }); // Prevent disk leakage

afterAll(async () => {
  const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
  const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";

  // Clear isolated Firestore & Auth data using REST
  await fetch(
    `http://${firestoreHost}/emulator/v1/projects/${testProjectId}/databases/(default)/documents`,
    { method: "DELETE" },
  );
  await fetch(
    `http://${authHost}/emulator/v1/projects/${testProjectId}/accounts`,
    { method: "DELETE" },
  );

  await terminate(db);
  await deleteApp(app);
  // CRITICAL: Prevent JSDOM memory leak per AGENTS.md
  delete (globalThis as any).firestoreInstance;
});
```

**Zod Validated Direct Integration for Backend:**

```typescript
// src/server/campaignRoutes.ts
import * as admin from "firebase-admin";

export const createCampaignRoutes = () => {
  const router = Router();
  router.post("/start", async (req, res) => {
    // Ensure input sanitization and avoid Mass Assignment
    const validatedData = CampaignStartSchema.parse(req.body);

    // Directly use Firebase to maintain runTransaction boundaries (MLP Architecture)
    await admin.firestore().runTransaction(async (t) => {
      // Logic using validatedData
    });

    res.status(202).send();
  });
  return router;
};
```

**Mitigating 'Snapshot Beats the Fetch' (State Machines):**

```javascript
// DO NOT use booleans. Use specific explicit states and Correlation IDs.
const STATE_IDLE = Symbol("idle");
const STATE_MUTATING = Symbol("mutating");
const STATE_SNAPSHOT_RECEIVED = Symbol("snapshot_received");

// Before blindly applying fetch payloads:
if (this.state === STATE_SNAPSHOT_RECEIVED) {
  return; // The WebSocket already delivered the real-time update.
}
```

Once you approve this plan, I will execute the creation of the OpenSpec directory and populate all 5 files.
