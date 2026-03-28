---
title: Hybrid Scoring Engine & Intent-Based Testing
type: feat
status: active
date: 2026-03-27
---

# Hybrid Scoring Engine & Intent-Based Testing

## Overview

This plan introduces the **Hybrid Scoring Engine** to calculate a defensible "Tarpit Score" for user ideas, alongside a comprehensive architectural stabilization effort. We will fix critical UI race conditions during AI Ideation and establish an **Intent-Based Testing** safety net to ensure these key user flows remain robust.

## Problem Statement / Motivation

1. **Idea Validation Lacks Mathematical Rigor:** The platform currently relies on qualitative AI feedback to determine if an idea is a "Tarpit". We need a quantitative, defensible metric combining real-world competitor volume (Apollo.io) with semantic differentiation (Exa/LLM Vector Uniqueness).
2. **Architectural Fragility in Key Flows:**
   - **Race Conditions:** Users can click "Analyze" multiple times, causing in-flight AI requests to overwrite the UI unpredictably.
   - **Split-Brain State:** Local debouncing ignores incoming remote Firestore updates.
   - **Quota Panic:** Firebase rate-limit disconnects cause silent data loss.
3. **Brittle Tests:** Traditional unit tests mock implementation details rather than verifying the user's intent (e.g., "If I wait 30 seconds, I expect a clear timeout error, not a frozen screen").

## Proposed Solution

### 1. The Hybrid Scoring Engine (Tarpit Score)

We will implement a mathematically sound scoring algorithm using a **Log-Transformed Saturation Factor**.

**The Formula (Tarpit Index: 0-100, Higher = Worse):**

```javascript
// 0. Input Validation & Clamping (Security & Math Bounds)
// Product Edge Case (False Blue Ocean): Distinguish between API failure (null) and verified empty (0).
// If Apollo fails, we return a "Partial Score" rather than mathematically claiming a 0-competitor Blue Ocean.
if (apolloCount === null) {
  return {
    status: "partial_data",
    uniqueness: clampedUniqueness,
    error: "Apollo API unavailable",
  };
}
// Product Edge Case (Data Desert): If Exa returns 0 results, the terminology is flawed or the market doesn't exist.
if (exaResults === 0) {
  return { status: "data_desert", error: "No semantic footprint found." };
}

const safeCount = Math.max(0, apolloCount);

// With L2-normalized vectors, inner product (dot product) equals cosine similarity and can be [-1, 1]. Map/clamp to [0, 1].
// V8 Optimization: Nested Math.max/min maps to fast CPU conditional moves (cmov) and is 2-3x faster than lodash.clamp.
const clampedUniqueness = Math.max(0, Math.min(1, vectorUniqueness));

// 1. Uniqueness (1.0 = highly unique, 0.0 = exact clone)
const uniqueness = clampedUniqueness;

// 2. Saturation Penalty (Logarithmic decay up to a ceiling of 100 competitors)
// Note: Precompute the denominator constant outside the function scope (e.g., LOG1P_MAX_COMPETITORS = Math.log1p(100))
// We use Math.log1p(safeCount) instead of Math.log(safeCount + 1) for better floating point precision near zero.
const saturationFactor = Math.log1p(safeCount) / LOG1P_MAX_COMPETITORS;
const cappedSaturation = Math.max(0, Math.min(1.0, saturationFactor));

// 3. Apply Weights (Aligning with OpenSpec: Uniqueness * 0.4 + Apollo * 0.6)
// Math.round eliminates floating point precision leaks.
const tarpitScore = Math.round(
  ((1.0 - uniqueness) * 0.4 + cappedSaturation * 0.6) * 100,
);
```

_Interpretation: > 80 = Extreme Tarpit. < 30 = Strong Niche / Blue Ocean._

**Machine Learning Best Practices (Leeroopedia & M&A Due Diligence):**

1. **Grammar-Constrained Decoding:** The LLM extraction step must use structured output APIs (e.g., Gemini `response_schema` or OpenAI Structured Outputs) and strictly verify `finish_reason === "stop"`.
2. **Deterministic Ground Truth Generation:** The LLM parser must be locked to `temperature=0` to ensure highly reproducible extractions for the M&A evidence chain.
3. **Zod Boundary Parsing & Gemini Quirk:** We never trust `JSON.parse` directly. The LLM output must be parsed through a strict Zod schema (`LLMExtractionSchema`) at the boundary. _Critical Pitfall:_ Gemini 2.5 silently ignores Zod constraints like `.min()`, `.max()`, and `.regex()` during generation. You must enforce these constraints explicitly in the client-side `safeParse()` and use a retry loop (feeding errors back to the LLM) if it hallucinates invalid values.
4. **Scoring Version Registry (YAGNI Optimized):** To maintain an audit trail without database bloat, persist a simple integer `scoring_version: 1` alongside the score and the evidence chain, rather than dumping static system config into every record. Maintain a git-tracked `scoring_weights.json` mapped to this integer.

**Simplicity & Performance (YAGNI):**
Calculating vector uniqueness (pure inner product on L2-normalized vectors over 768 dimensions) executes synchronously in fractions of a millisecond in V8. We will **reject** premature optimizations like `setImmediate` chunking.
_Performance Critical:_ For Orthogonal Vector Distance (the "Wedge Metric"), allocate a single `Float32Array` scratchpad to avoid massive Garbage Collection (GC) pauses caused by allocating hundreds of new arrays inside the loop.

### 2. M&A Explainability & False Positive Prevention

Presenting a raw, opaque number to founders violates our mandate for actionable intelligence and fails M&A defensibility requirements. The synchronous engine will implement:

- **Source Record Attribution:** The LLM parsing step must enforce a `_reasoning` Chain-of-Thought field, and map generated JSON features directly to verbatim text quotes (`exact_quote`) and URLs (`exa_url`).
  - _Security Critical:_ The `exa_url` must be strictly validated using the native `URL` constructor to permit only `http:` and `https:`, preventing Stored XSS via `javascript:` URIs.
- **Orthogonal Vector Distance (The Wedge Metric):** To prevent penalizing hyper-specific niches adjacent to crowded markets, the engine calculates the orthogonal distance. If this "wedge" exceeds a hardcoded threshold, it strictly overrides the tarpit flag, confirming a defensible blue ocean.
  - _Product Strategy Note:_ Never expose ML jargon (Orthogonal Vector Distance, L2-Normalized, Vector Uniqueness) to the user. The UI visualization must clearly illustrate a crowded horizontal market and visually demonstrate how the founder's hyper-specific idea slices through the noise (the Wedge). Use founder-centric value propositions like "Market Saturation," "Unique Differentiation," and "Defensible Niche."

### 3. The "Safe Timeout" UI Lock & Server Protection

To fix the AI race conditions, we will implement a dual-layer safeguard leveraging modern React 19 and Express 5.x constraints:

- **Client-Side Async Transition Lock:** React 19 Compiler strictly forbids mutable `useRef` locks during the render cycle. We must use React 19's native `useTransition` or `useActionState`. Wrapping the API call in `startTransition` natively provides an `isPending` boolean that safely disables the button and prevents race conditions without legacy React 18 anti-patterns. _Gotcha:_ React 19 loses the async context scope after an `await` keyword. Any state updates that occur _after_ the `await` must be re-wrapped in a secondary, synchronous `startTransition(() => { setResult(data) })` call to prevent UI tearing.
- **Deterministic Timeout (with Cleanup):** A strict 30-second timeout acts as a circuit breaker.
  - _Error Handling:_ `.abort()` throws a `DOMException` (`AbortError`). The `try/catch` block must explicitly catch this specific error to transition to the `timeout` state.
  - _Unmount Cleanup:_ The hook must return a cleanup function to `useEffect` that calls `clearTimeout` AND `.abort()` if the component unmounts while in flight, preventing memory leaks and stale closures.
- **Server-Side Protection (Security):** To prevent DoS (Denial of Wallet) via LLM spam and Event Loop blocking:
  - **Payload Exhaustion Prevention:** Enforce a strict global limit of `100kb` for `express.json` at the middleware layer. Node.js parsing massive arrays blocks the event loop. _Express 5.x Constraints:_ 1) The error middleware must explicitly catch the `PayloadTooLargeError` thrown by `body-parser` and return a strict integer status code: `res.status(413).json({ error: "Payload too large" })`. 2) If the payload is empty, `req.body` defaults to `undefined` (not `{}` like 4.x), so explicit null-checks are required before destructuring payload values.
  - **Stateless API Rate Limiting:** Apply an `express-rate-limit` middleware backed by a Redis store (`rate-limit-redis`). Key the limit via `req.user.id` (not just IP, which blocks shared-NAT offices). We reject stateful Firestore `is_analyzing` locks because they introduce TOCTOU races and stranded state bugs.

### 4. Intent-Based Testing Safety Net

We will replace implementation-detail tests with Intent-Based Tests focused on user outcomes, using descriptive BDD naming conventions instead of QA codes:

- **MSW (Mock Service Worker 2.x):** Intercept the AI `/api/campaign/start` routes at the network boundary.
- **React Testing Library (RTL):** Query by accessibility role (`getByRole('button', { name: /analyze/i })`).

**Testing (Fake Timers & Async Resolution):**
To definitively prove the "Safe Timeout" UI Lock recovers from a systemic hang:

- We will configure `@testing-library/user-event` to map to Vitest's fake timers (`advanceTimers: vi.advanceTimersByTime`).
- We will use MSW to force an extremely long finite delay (e.g., `await delay(99999999)`). _Performance Pitfall:_ Do not use `delay('infinite')` because it leaves an unresolved Promise in memory that can cause Vitest CI runners to hang indefinitely during teardown.
- We will fast-forward time using `await vi.advanceTimersByTimeAsync(30000)`. Never wrap this in `act()` directly; use a `waitFor` assertion block immediately after.
- _Teardown Safety:_ We will strictly call `vi.useRealTimers()`, `vi.runOnlyPendingTimers()`, AND `vi.clearAllTimers()` in the `afterEach` block to prevent test suite cross-pollution.

## Implementation Phases

### Phase 1: The Hybrid Scoring Engine

- [ ] Create `src/utils/scoringEngine.ts` and precompute mathematical constants (e.g., `LOG_MAX_COMPETITORS`).
- [ ] Implement the `calculateTarpitScore(vectorUniqueness, apolloCount)` function using strict TypeScript checks to prevent `NaN`.
- [ ] Write boundary unit tests (e.g., 0 competitors, 10,000 competitors, exact clone vector).
- [ ] Implement Grammar-Constrained Decoding (`response_schema`) for the LLM extraction with `temperature=0`.
- [ ] Parse LLM outputs through a strict Zod schema (`LLMExtractionSchema`) that enforces `_reasoning`, `exa_url`, and `exact_quote`.
- [ ] Calculate Orthogonal Vector Distance ("Wedge Metric") using a single pre-allocated `Float32Array` scratchpad to prevent GC pauses.
- [ ] Validate `exa_url` strictly against `http/https` protocols to prevent Stored XSS.
- [ ] Integrate the score into the `/api/campaign/start` deep validation route and append `scoring_version: 1` to the database record.

### Phase 2: Architectural Fixes & UI Lock

- [ ] Wrap the API call in React 19's native `useTransition` or `useActionState` to track async transitions (`isPending`) without violating the React Compiler's `useRef` constraints.
- [ ] Implement `AbortController` timeout logic, explicitly catching `AbortError` and providing strict `useEffect` unmount cleanup.
- [ ] Fix the "Split-Brain" sync issue in `useFirebaseSync.ts` by ensuring remote snapshots safely merge with local optimistic updates.
- [ ] Implement stateless API rate limiting and Express 5.x payload error handling middleware on the BFF route.
- [ ] Implement Product Edge Case UI States:
  - **Partial Score:** A UI state when Apollo fails, providing the user with a manual G2/Capterra search JTBD.
  - **Data Desert Warning:** A UI state when Exa returns 0 results, providing a customer interview JTBD.
  - **Raw Market Signal:** A fallback UI that displays unparsed Exa snippets if the LLM Zod retry loop exhausts.
- [ ] Update UI results components to prominently render the M&A-defensible `exact_quote` and hyperlink the validated `exa_url`.
- [ ] Design and implement a specific UI state (Wedge Visualization) for when the Orthogonal Vector Distance override is triggered.

### Phase 3: Intent-Based Test Coverage

- [ ] Setup MSW in the Vitest environment (`tests/setup.ts`).
- [ ] Write **it('prevents concurrent analysis requests by natively disabling the DOM element via React 19 isPending')**
- [ ] Write **it('unlocks the UI and displays a warning when the API hangs for 30 seconds')** using Vitest fake timers and an MSW `AbortSignal` listener to gracefully mimic a real-world socket closure instead of an infinite delay memory leak.
- [ ] Write **it('gracefully handles Express 413 Payload Too Large and 429 Quota Exceeded responses')**
- [ ] Write **it('downgrades to a Partial Score UI with a manual research JTBD when Apollo returns a 500 error')**
- [ ] Write **it('triggers a Data Desert warning with a customer interview JTBD when Exa returns 0 results')**
- [ ] Write **it('renders accessible Source Record Attribution links and quotes upon successful analysis')**
- [ ] Write **it('overrides the Tarpit warning and displays defensible wedge messaging when orthogonal distance is high')**

## Acceptance Criteria

- [ ] The Tarpit Score correctly penalizes high competitor counts logarithmically and uses strict Zod boundary parsing.
- [ ] The engine executes synchronously with minimal GC pauses, utilizing pre-allocated `Float32Array` scratchpads.
- [ ] The UI provides actionable Source Record Attribution with strict Stored XSS prevention on URLs.
- [ ] The engine correctly overrides horizontal tarpit flags if the Orthogonal Vector Distance proves a specific "niche wedge".
- [ ] The UI state is managed by a Discriminated Union and protected against batching races via a synchronous `useRef` lock.
- [ ] If the AI backend hangs, the `AbortError` is caught, the UI recovers automatically, and unmounting cleans up the timer.
- [ ] Intent-based tests utilizing MSW and RTL fake timers achieve 100% coverage on the new `useSafeAITask` hook.

## References & Research

- **Leeroopedia ML Best Practices**: Grammar-Constrained Decoding, Data Quality Audit Layers, Scoring Definition Versioning.
- **OpenSpec**: `openspec/changes/hybrid-scoring-tarpit-flywheel` (For backend infrastructure, data lifecycle, and asynchronous clustering tasks).
- Data Science Best Practices for Composite Indicators (Min-Max Scaling, Log Transformations for heavy-tailed metrics).
- React Testing Library Guiding Principles: "The more your tests resemble the way your software is used, the more confidence they can give you."
- MSW 2.x Network Boundary interception patterns.
