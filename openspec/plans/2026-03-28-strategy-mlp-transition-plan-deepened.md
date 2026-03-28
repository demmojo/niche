## Enhancement Summary

**Deepened on:** 2026-03-28
**Sections enhanced:** 5
**Research agents used:** best-practices-researcher, architecture-strategist

### Key Improvements

1. **Automated Enforcement Tools:** Introduced ESLint, `ai-eval` prompt upgrades, and `.cursor/rules` to enforce MLP UX automatically rather than relying on human diligence.
2. **Zero-CLS Technical Blueprint:** Added concrete React/CSS implementation patterns (`overflow-anchor`, `min-height`) and performance throttling strategies for high-frequency GenAI streaming text.
3. **Async Job Architectures with Firestore Limit Awareness:** Highlighted Firestore's 1 write/sec/document limit and provided strategies (lodash.throttle) to manage real-time GenAI token streaming without hitting quotas.
4. **Strongly-Typed Fault Tolerance:** Added the `ErrorMonad` (Discriminated Union) combined with `opossum` Circuit Breakers to handle unpredictable deep-search APIs (Exa/Apollo).

### New Considerations Discovered

- **Review Fatigue:** Generating too many Human-in-the-Loop approval gates can cause users to mindlessly rubber-stamp actions. Must distinguish between low-stakes and high-stakes operations.
- **Main Thread Thrashing:** Parsing massive markdown strings 60 times a second will freeze the UI. Needs throttling `requestAnimationFrame`.

---

# OpenSpec Plan: MVP to MLP Transition Strategy

**Date:** 2026-03-28
**Type:** strategy
**Name:** mlp-transition-philosophy

## 1. Context & Objective

The transition from a Minimum Viable Product (MVP) to a Minimum Lovable Product (MLP) within the NicheAI platform requires shifting our baseline architectural, product, and design principles. We are moving from "proving the hypothesis" to "earning user loyalty" by optimizing for trust, perceived performance, and emotional resonance.

This document defines the actionable plan to incorporate this new philosophy into our daily Product, Design, and Developer workflows, as well as the underlying codebase.

## 2. Product Workflow Changes: Architecting for Anticipation

Every new feature or OpenSpec proposal must now adhere to the following product gates before development begins:

1. **Eliminate the Blank Canvas:** No feature can ship with an open-ended input as its primary interface. All GenAI interactions must be preceded by opinionated wizards or templates.
2. **The "Next Best Action" Rule:** Every complete workflow must explicitly define and present a one-click action for the user's next logical step. "Done" is no longer an acceptable end state.
3. **Graceful GenAI Degradation:** Every AI-driven feature must have a defined "Human Fallback" (Human-in-the-Loop) state. If the AI hallucinates, the user must be able to seamlessly edit the result without losing their progress.

### Research Insights

**Best Practices:**

- Update `scripts/openspec-cli/index.ts ai-eval` LLM prompts to automatically **fail** any proposal that does not define default UI states and Next Best Actions.
- Manage **Review Fatigue** by enforcing Calibrated Autonomy. Auto-approve low-stakes classifications, while keeping high-stakes operations strictly behind a HITL (Human-in-the-Loop) transaction.
- Update the PR Template (`.github/pull_request_template.md`) to include an **MLP & GenAI UX Checklist** (verifying fallback forms and suggestion chips).

**Implementation Details:**

```typescript
// Enforce No Blank Canvases by building restrictive UI Components
// A custom ESLint rule must enforce this component over standard <textarea> in AI contexts.
interface GenerativeInputProps {
  value: string;
  suggestions: string[]; // <-- TypeScript enforces the Next Best Action/Suggestions
  onSuggestionClick: (text: string) => void;
  isLoading?: boolean;
}
```

## 3. Design Workflow Changes: Architecting for Flow

Visual polish equates to system reliability. The design handoff process must now mandate:

1. **Zero Cumulative Layout Shift (CLS):** Streaming text must be confined within fixed-height or `min-height` containers with `overflow-y-auto` to prevent the UI from jumping during generation.
2. **Skeletons Over Spinners:** Generic loading spinners are banned for primary data fetches. High-fidelity skeleton screens that match the final component layout are required to reduce perceived wait times.
3. **Tactile Micro-Interactions:** Success states for long-running processes must include subtle visual rewards (e.g., staggered entrance animations, scale pulses, toast notifications).
4. **Accessibility First:** Keyboard navigation (`Tab`, `Enter`, `Cmd+K` command palettes) and distinct focus states (`focus-visible:ring-2`) must be designed, not treated as an afterthought.

### Research Insights

**Best Practices:**

- Combine `overflow-anchor: auto` with a hidden 1px `div` at the bottom of a container to rely on native browser scroll anchoring. This halts CLS instantly during streaming updates.
- Use an `<AIFallbackWrapper>` component with a `fallback` prop containing standard manual forms, ensuring the UI can seamlessly downgrade.

**Performance Considerations:**

- Parsing large chunks of Markdown on every new token can cause severe Main Thread blocking. Limit the update loop frequency to 50ms intervals or `requestAnimationFrame` when managing heavy React components.
- Markdown images (`![alt](url)`) trigger CLS upon loading. Add global CSS rules to constrain their aspect ratios in Markdown outputs.

## 4. Developer & Codebase Workflow Changes: Architecting for Trust

Tech debt that impacts the user experience is no longer tolerated. The CI/CD and Code Review processes must enforce the following:

### 4.1. The API & State Layers (Performance)

- **Asynchronous Job Queues:** Synchronous, blocking calls to LLMs or external APIs are strictly prohibited. All long-running processes must return an HTTP `202 Accepted` with a `jobId`, allowing the client to subscribe via WebSockets or Firestore `onSnapshot`.
- **Optimistic UI:** State mutations must be optimistic on the client. Heavy rendering (e.g., complex Markdown or Generative UI) must be wrapped in React 19's `useTransition` or `useDeferredValue` to ensure the main thread never blocks user input.
- **Pre-fetching on Intent:** Data fetching must move to "fetch on hover" or "fetch on intent" to mask network latency.

### Research Insights

**Best Practices:**

- Define strict discriminated unions for job statuses (`pending`, `processing`, `completed`, `failed`) and prevent the "boolean soup" of loading states in UI components.
- Use `lodash.throttle` (or similar) on the backend worker to throttle token sync writes.

**Performance Considerations:**

- **Firestore Write Limit Warning:** Firestore imposes a hard limit of **1 write per second per document**. You cannot stream raw LLM tokens into a Firestore document at 60 tokens/sec. Use a ~1.5 second throttle for DB synchronization and rely on WebSocket/SSE streams for high-fidelity updates if sub-second precision is required.

**Implementation Details:**

```typescript
// Background Node.js Worker Sync to avoid Firestore limit exceptions
const syncToFirestore = throttle(
  async (text: string) => {
    await docRef.update({ partialResult: text });
  },
  1500,
  { leading: true, trailing: true },
);
```

### 4.2. The Data & Validation Layers (Integrity)

- **Strict End-to-End Typing:** All API contracts and LLM outputs must be validated using `z.discriminatedUnion` schemas in Zod. Schema drift must be caught at runtime before polluting the database.
- **Transactional Safety:** Concurrent state changes and Human-in-the-Loop merges must use strict database transactions (e.g., Firestore `runTransaction`).
- **Append-Only Models:** Critical data structures (like user prompts or generated strategies) must shift to an Append-Only or Slowly Changing Dimension (SCD) Type 2 architecture to provide built-in version history and rollbacks.

### Research Insights

**Implementation Details:**

```typescript
// Zod Discrimination explicitly mapping out AI states
const AIGeneratedEntitySchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("pending_review"), data: z.any() }),
  z.object({
    status: z.literal("approved"),
    data: z.any(),
    approvedBy: z.string(),
  }),
  // Enforces a human fallback mapping to prevent data loss
  z.object({ status: z.literal("rejected"), fallbackHumanData: z.any() }),
]);
```

### 4.3. The Resiliency & Quality Layers

- **Typed Contextual Errors:** Generic 500 errors are banned. The backend must throw typed error objects (`{ code: 'RATE_LIMITED', userMessage: '...' }`) to trigger specific, actionable Fallback UIs on the client.
- **Circuit Breakers:** External intelligence APIs (Exa, Apollo) must be wrapped in Circuit Breakers to prevent application crashes when third parties degrade.
- **Intent-Based Testing:** 80-100% test coverage using React Testing Library and MSW is required for all critical paths. Code cannot ship if it cannot be automatically verified for user intent.

### Research Insights

**Best Practices:**

- Build an **ErrorMonad** (e.g., `Result<T, E> = Success<T> | Failure<E>`). Catch predictable API failures (e.g. rate limits) and resolve them into semantic `Failure` objects rather than throwing unchecked runtime Exceptions.
- Mandate `.rejects()` or `.fails()` mocking in all Intent-Based AI Tests using MSW to guarantee the UI fallback states correctly trigger during test suites.

**Implementation Details:**

```typescript
// Opossum Circuit Breaker + Monad implementation for External API Resiliency
import CircuitBreaker from "opossum";
import { Result, ok, err } from "./result";

const exaBreaker = new CircuitBreaker(fetchExaIntelligence, {
  timeout: 10000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
});

export async function safeExaSearch(
  query: string,
): Promise<Result<ExaResponse, AppError>> {
  try {
    const data = (await exaBreaker.fire(query)) as ExaResponse;
    return ok(data);
  } catch (error: any) {
    if (error.code === "EOPENBREAKER") {
      return err({
        code: "CIRCUIT_OPEN",
        isCircuitOpen: true,
        message: "Degraded connection",
      });
    }
    return err({
      code: "API_FAILURE",
      message: "Failed fetching intelligence",
    });
  }
}
```

## 5. Execution Roadmap (Tasks)

To roll this out across NicheAI, we will execute the following phased approach:

- [ ] **Phase 1: Codify the Rules & Tooling**
  - Update `.cursor/rules/mlp-ux.mdc` to enforce MLP UX rules systemically.
  - Update `scripts/openspec-cli/index.ts` to block OpenSpecs missing Next Best Actions.
  - Update `AGENTS.md` and `.github/pull_request_template.md` to establish testing expectations (MSW LLM timeout mocks).
- [ ] **Phase 2: Establish UI Foundations**
  - Build a standardized `<SkeletonLoader />` component library.
  - Refactor the `<StreamingText />` component to use `overflow-anchor: auto`, `min-height`, and throttle markdown re-renders.
  - Implement a standardized `ErrorMonad` wrapper (`Result<T, E>`) for the backend API layer.
- [ ] **Phase 3: Retrofit Core Workflows**
  - Audit and refactor the `BrandWizard` flow to use the Asynchronous Job Queue pattern (if not already fully compliant).
  - Wrap external intelligence modules (Exa) in `opossum` Circuit Breakers.
  - Audit the `MarketIntelligence` flow to ensure optimistic UI and pre-fetching on intent.
- [ ] **Phase 4: Tooling & Telemetry**
  - Implement the Superadmin observability dashboard to track UX friction (e.g., manual edits to AI outputs).

## Future Considerations

- **FinOps Routing:** As we scale, we will need to implement a dynamic router that chooses between Gemini Flash (for basic tasks) and Pro (for complex reasoning) to maintain unit economics while delivering an MLP experience.
- **Generative UI (React Server Components):** Fully migrating away from JSON parsing toward streaming interactive React components directly from the LLM pipeline.
