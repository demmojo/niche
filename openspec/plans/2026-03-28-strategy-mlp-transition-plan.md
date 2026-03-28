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

## 3. Design Workflow Changes: Architecting for Flow

Visual polish equates to system reliability. The design handoff process must now mandate:

1. **Zero Cumulative Layout Shift (CLS):** Streaming text must be confined within fixed-height or `min-height` containers with `overflow-y-auto` to prevent the UI from jumping during generation.
2. **Skeletons Over Spinners:** Generic loading spinners are banned for primary data fetches. High-fidelity skeleton screens that match the final component layout are required to reduce perceived wait times.
3. **Tactile Micro-Interactions:** Success states for long-running processes must include subtle visual rewards (e.g., staggered entrance animations, scale pulses, toast notifications).
4. **Accessibility First:** Keyboard navigation (`Tab`, `Enter`, `Cmd+K` command palettes) and distinct focus states (`focus-visible:ring-2`) must be designed, not treated as an afterthought.

## 4. Developer & Codebase Workflow Changes: Architecting for Trust

Tech debt that impacts the user experience is no longer tolerated. The CI/CD and Code Review processes must enforce the following:

### 4.1. The API & State Layers (Performance)

- **Asynchronous Job Queues:** Synchronous, blocking calls to LLMs or external APIs are strictly prohibited. All long-running processes must return an HTTP `202 Accepted` with a `jobId`, allowing the client to subscribe via WebSockets or Firestore `onSnapshot`.
- **Optimistic UI:** State mutations must be optimistic on the client. Heavy rendering (e.g., complex Markdown or Generative UI) must be wrapped in React 19's `useTransition` or `useDeferredValue` to ensure the main thread never blocks user input.
- **Pre-fetching on Intent:** Data fetching must move to "fetch on hover" or "fetch on intent" to mask network latency.

### 4.2. The Data & Validation Layers (Integrity)

- **Strict End-to-End Typing:** All API contracts and LLM outputs must be validated using `z.discriminatedUnion` schemas in Zod. Schema drift must be caught at runtime before polluting the database.
- **Transactional Safety:** Concurrent state changes and Human-in-the-Loop merges must use strict database transactions (e.g., Firestore `runTransaction`).
- **Append-Only Models:** Critical data structures (like user prompts or generated strategies) must shift to an Append-Only or Slowly Changing Dimension (SCD) Type 2 architecture to provide built-in version history and rollbacks.

### 4.3. The Resiliency & Quality Layers

- **Typed Contextual Errors:** Generic 500 errors are banned. The backend must throw typed error objects (`{ code: 'RATE_LIMITED', userMessage: '...' }`) to trigger specific, actionable Fallback UIs on the client.
- **Circuit Breakers:** External intelligence APIs (Exa, Apollo) must be wrapped in Circuit Breakers to prevent application crashes when third parties degrade.
- **Intent-Based Testing:** 80-100% test coverage using React Testing Library and MSW is required for all critical paths. Code cannot ship if it cannot be automatically verified for user intent.

## 5. Execution Roadmap (Tasks)

To roll this out across NicheAI, we will execute the following phased approach:

- [ ] **Phase 1: Codify the Rules**
  - Update `.cursor/rules/product-vision.mdc` to include the "Next Best Action" and "Human Fallback" mandates.
  - Update `AGENTS.md` to enforce Skeletons, Zero-CLS streaming, and Optimistic UI.
- [ ] **Phase 2: Establish UI Foundations**
  - Build a standardized `<SkeletonLoader />` component library.
  - Refactor the `<StreamingText />` component to enforce `min-height` and `overflow-y-auto` (Zero CLS).
  - Implement a standardized `ErrorMonad` wrapper for the backend API layer.
- [ ] **Phase 3: Retrofit Core Workflows**
  - Audit and refactor the `BrandWizard` flow to use the Asynchronous Job Queue pattern (if not already fully compliant).
  - Audit the `MarketIntelligence` flow to ensure optimistic UI and pre-fetching on intent.
- [ ] **Phase 4: Tooling & Telemetry**
  - Implement the Superadmin observability dashboard to track UX friction (e.g., manual edits to AI outputs).

## Future Considerations

- **FinOps Routing:** As we scale, we will need to implement a dynamic router that chooses between Gemini Flash (for basic tasks) and Pro (for complex reasoning) to maintain unit economics while delivering an MLP experience.
- **Generative UI (React Server Components):** Fully migrating away from JSON parsing toward streaming interactive React components directly from the LLM pipeline.
