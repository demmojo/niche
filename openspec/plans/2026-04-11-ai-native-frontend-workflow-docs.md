---
title: Update Documentation with NicheAI's Opinionated UI Pipeline
status: draft
dependencies: []
---

# Proposal: NicheAI’s Opinionated UI Pipeline (The Anti-Slop MLP Stack)

## Context & Objective

As the AI-native development ecosystem evolves in 2026, the primary challenge for frontend engineering is no longer speed, but avoiding "regression to the mean"—the homogenization of design often referred to as "AI Slop."

We need to formalize NicheAI’s opinionated frontend development workflow in our `README.md` and developer onboarding documentation. This update will guide contributors on how to orchestrate the modern 2026 stack (Cursor/Windsurf, Gemini 3.1 Pro, Claude 4.6, v0) while avoiding the critical traps of "Toolchain Fatigue", the "Walled Garden" problem, and the "Day 2 Maintenance Problem."

## Strategic Alignment & Architectural Philosophy

After rigorous adversarial and product reviews, we have aligned on the following core philosophies:

- **The Core Local Workflow:** The primary workflow is not an external "Walled Garden" of premium subscriptions. The primary pipeline relies on centralizing our constraints into local `.cursor/prompts` to guide local IDE agents (Cursor/Windsurf). External tools (v0, Stitch) are _optional_ Day 1 accelerators.
- **The "Colocated Components" Reality:** We explicitly reject over-engineering human abstractions (like strict Container/Presenter or Slot composition) that fight LLM tendencies. LLMs excel at generating cohesive, colocated files (UI + localized state together). Forcing them into strict inversion of control causes hallucination.
- **The "One-Way Trip" vs "Halt & Update":** Because we allow colocated components, sending a component back to v0 on "Day 2" is destructive. Once business logic (Firebase/React Context) is injected, all future iterations must happen locally in Cursor using AST-aware diffing or focused Claude 4.6 editing.

## The Proposed Pipeline (To be added to README.md)

We will introduce a new section: **NicheAI’s Opinionated UI Pipeline (The Anti-Slop MLP Stack)**.

### State Milestone 1: Structural (Visual Thesis & IA) (The "Why" and "Where")

- **Action:** Define a 1-sentence **Visual Thesis** (mood, typography, composition) and map the **Information Architecture**.
- **Constraint (Functional Design Thinking):** Embrace Tailwind v4's native OKLCH color spaces for dynamic, perceptually uniform palettes. This softens the strict "anti-card" dogma by allowing rich, low-contrast surfaces (soft cards) that look sophisticated and "Anti-Slop", avoiding generic purple-on-white SaaS defaults. **Strict Conditional Pattern:** Cards may ONLY be used for distinct, interactable data entities (e.g., a selectable product unit). They are STRICTLY FORBIDDEN as generic layout containers, structural padding wrappers, or aesthetic backgrounds.
- **Tooling:** Freeform text, or optionally Google Stitch 2.0 / Figma for "Vibe Design".

### State Milestone 2: Scaffolded (The Core Local Workflow)

- **Action:** Scaffold components using NicheAI's centralized prompts (to be added as `.cursor/prompts/ui-scaffold.md`).
- **Constraint (YAGNI & 5-State Rule):** For _dynamic zones_ (data tables, forms, AI chats), the prompt must generate all 5 interaction states (loading, empty, error, success, partial). For static components, ignore this to prevent codebase bloat.
- **Tooling:** Cursor / Windsurf Agent. (Optional Premium: Paste the prompt into v0 or Lovable).

### State Milestone 3: Wired (Logic & Integration)

- **Action:** Wire up business logic (Split React Contexts, Firebase) and handle ongoing maintenance.
- **Constraint (The Colocated One-Way Trip):** Once business logic is injected, the component is locked to the local IDE. External scaffolding tools will overwrite the logic.
- **Constraint (Split React Contexts):** Inter-Component / Global Business Logic must use React Context. To prevent render cascades, strictly split React Contexts (separating state and dispatch) for global providers (e.g., `<WorkspaceProvider>`). We explicitly reject Zustand migrations to minimize dependency bloat; local intrinsic component state must remain local to preserve Colocation.
- **Constraint (Accessibility):** AI-generated states must be explainable. Enforce `aria-live="polite"` instead of generic spinners.
- **Tooling:** Cursor / Windsurf. Use Claude 4.6 for complex React 19 logic compilation, and Gemini 3.1 Pro (via `cursor-ide-browser` MCP) for visual QA.

## AI UX & Stream Resilience

To prevent "AI Slop" in user experience, we reject opaque loading states and overly complex server-side rendering paradigms.

- **Two-Phase Fetch Strategy:** Never use generic spinners for long-running AI tasks. Implement a two-phase architecture: Phase 1 fetches fast, deterministic data (e.g., Exa search results, <2s) to immediately satisfy user intent. Phase 2 kicks off background LLM promises to fill in complex analysis, replacing UI shimmers asynchronously via React 19 `<Suspense>`.
- **Generative UI without RSC:** We explicitly reject React Server Components (RSC) migrations for building Generative UI. Instead, the backend must return strictly typed JSON chunks (via SSE). The frontend parses these streams and uses React 19's `useOptimistic` to instantly render predictable, interactive AI UI components.
- **SSE Stream Handling (React 19 Concurrent Primitives):** Server-Sent Events (SSE) must be processed natively on the client. We strictly **reject** bypassing the Virtual DOM (e.g., mutating refs directly) for high-frequency token streaming, as it guarantees DOM/VDOM desynchronization bugs. Furthermore, do **not** wrap post-`await` state setters in a secondary `startTransition` if the stream is already initiated via `useActionState`, because React 19 natively tracks the async boundary. Instead, rely entirely on React's concurrent primitives (`useDeferredValue` and Async Transitions) to smoothly absorb and batch high-frequency state updates without freezing the UI.

## Execution Plan

1. **Create `.cursor/prompts/ui-scaffold.md` (The Scaffolding Core):**
   - Implement a robust, XML-based structure optimized for LLM instruction parsing (Claude 4.6).
   - Require a `<thought>` block to evaluate if the component is Dynamic vs. Static.
   - **Dynamic Context Injection:** Agents must dynamically read a generated `design-tokens.json` manifest before generating code. Parsing raw Tailwind v4 CSS wastes LLM context window. Hardcoded token hallucination or searching for deprecated `tailwind.config.ts` files is strictly prohibited.
   - **Enforce Visual Thesis Primitives:** Require a `<design_system_mapping>` block to translate the abstract Visual Thesis into explicit positive layout primitives (e.g., "Cardless Interaction", "Focus-Driven Workspace", "Single Visual Anchor") and specific Tailwind v4 token constraints. Ensure Tailwind v4 CSS variables are used to natively target Radix UI `data-[state=...]` attributes for interactive component styling.
   - Enforce the **Colocated Components** pattern (UI + Logic in a single file) to minimize cognitive load and maximize LLM generation reliability (avoiding the "Split-Brain" problem).
   - **Boundary Definition (Colocation vs. Extraction):** Zod schemas and pure data transformations go in sibling files (e.g., `*.logic.ts`), but ALL React hooks (including `useActionState`, `useOptimistic`) and local state remain in the `.tsx` file. Keep the `.tsx` AST flat and under 300 lines to ensure local IDE agents can navigate updates without choking on AST rewrites.
   - **Enforce Progressive State Handling:** Replace the naive "generate all 5 states upfront" rule. Instead, prompt the IDE agent to build _only_ the **Success (Happy Path)** and the **Loading Skeleton** first. Require dynamic components to use Discriminated State Unions (never boolean soup) to handle these states, utilizing React 19 `useTransition` and `useOptimistic` for graceful degradation. Subsequent states (Error, Empty, Partial) should only be enriched via a targeted secondary prompt after the Happy Path is verified against real data contracts.
   - Enforce **React 19 AbortControllers**: Require that all data fetching hooks and side-effects within the colocated component use `AbortSignal`s to prevent race conditions ("Snapshot Beats the Fetch").
   - **Anti-Pattern Ban (No Code Watermarking):** Explicitly forbid "AI watermarking" (e.g., `// AI generated`, `// Prompted by Claude`, artificial block headers). Code generated by AI must be stylistically indistinguishable from human-written code.
2. **Prompts are Code (Git-backed versioning & Human Review):**
   - Treat `.cursor/prompts` as mission-critical application infrastructure. They must be version-controlled alongside application code.
   - Rely on rigorous human PR review for prompt changes. Avoid overly complex or flaky "Stochastic CI" pipelines for prompt evaluations.
3. **Functional UI Testing (React 19 & MSW Parity):**
   - Update testing documentation to enforce Functional UI Testing using React Testing Library (RTL) combined with MSW for network mocks.
   - Enforce React 19 test paradigms: when testing components consuming SSE streams or Promises via React 19's `<Suspense>` and `use()`, you MUST wrap the initial RTL `render()` call AND every subsequent stream injection (e.g., `controller.enqueue()`) in `await act(async () => { ... })`. Failing to do so will cause "suspended inside an act scope" errors.
   - **Testing Timers & Async UI:** When testing polling intervals or simulated delays alongside `userEvent`, avoid synchronous timer increments. Strictly use `await vi.advanceTimersByTimeAsync()` or `await vi.runAllTimersAsync()` to trigger callbacks synchronously while preserving `userEvent` and internal `waitFor` loop stability.
   - **Pragmatic Testing & Async Interactions:** When writing Vitest tests for async buttons or pointer-blocked elements, JSDOM `pointer-events` blockages will often fail `userEvent.click()`. Pragmatically bypass this by using synchronous `fireEvent.click()` to simulate interactions (like rapid double-clicks) and verify internal deduplication logic.
   - Mandate that all LLM outputs or schema validation behaviors in tests leverage Zod Discriminated Unions rather than exact string assertions.
   - **Strict Mocking Boundaries:** Fully mock `@radix-ui/*` primitives with `children` passthroughs or simple `div`s rather than advancing fake timers, as their internal CSS animations and async loops conflict with Vitest `vi.useFakeTimers()`. Additionally, when mocking Firebase Firestore (`firebase/firestore`), ensure `getFirestore` and `initializeFirestore` return an object (`vi.fn(() => ({}))`) to prevent Proxy target errors, and include `memoryLocalCache` and `setLogLevel` in exports.
4. **Intent Validation (E2E):**
   - Enforce 100% intent coverage using E2E filesystem integration tests without mocks.
   - Mandate Playwright and Firebase Emulators for true Intent Validation.
   - For local UI testing without signing in, use Playwright E2E Test Mode by appending `?mock_auth=true` (superadmin: `mo.hassaniv@gmail.com`) or `?mock_auth=true&role=user` to bypass Firebase Auth listeners.
5. **Update `README.md`:** Integrate the new "NicheAI’s Opinionated UI Pipeline (The Anti-Slop MLP Stack)" section.
6. **Update `AGENTS.md`:** Document the "Colocated One-Way Trip", the XML prompt usage, Pure Logic Extraction, Progressive State Handling, and Functional UI / Intent Validation constraints to ensure autonomous agents adhere to these strict boundaries.

### Strategic Architectural Constraints: AI-Native Reliability & React 19 Parity

To ensure the NicheAI frontend remains resilient, easy for AI agents to reason about, and aligned with modern React 19 paradigms, all frontend execution must adhere to the following architectural constraints:

**1. Strategic Abstraction (DRY for Primitives, WET for Layouts)**

- **DRY Primitives:** Core UI building blocks must be strictly abstracted. Ban raw HTML `<button>` elements via ESLint `no-restricted-syntax`. Enforce a unified `<Button>` abstraction with internal promise resolution, default `type="button"`, and Radix UI compatibility. In React 19, pass `ref` directly as a prop (deprecating `forwardRef`). This provides a predictable, standardized foundation for AI code generation and reduces context exhaustion.
- **WET Layouts:** Feature-specific layouts and complex page compositions should embrace duplication (Write Everything Twice). Avoid creating hyper-generic, highly-parameterized "shared layout" wrapper components. Isolated, WET layouts allow AI agents to iterate rapidly on a specific feature's UI without the risk of unintended blast-radius regressions across other pages.

**2. Bimodal State Management**
State must be handled predictably using two distinct paradigms to prevent AI state hallucinations and React race conditions:

- **Declarative Data Fetching:** Leverage React 19's `use()` and `<Suspense>` boundaries for server-state and asynchronous data fetching. Offload the loading orchestration to the framework rather than manually juggling `isLoading` boolean toggles.
- **Discriminated Unions for Local State:** For complex local interactions (e.g., multi-step forms, AI generation phases), strictly type the state using TypeScript Discriminated Unions (e.g., `{ status: 'idle' } | { status: 'generating' } | { status: 'success', result: T } | { status: 'error', error: Error }`). This guarantees mutually exclusive states, making it impossible for the AI to introduce invalid UI conditions.
