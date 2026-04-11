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
- **Generative UI without RSC:** We explicitly reject React Server Components (RSC) migrations for building Generative UI. Instead, the backend must return strictly typed JSON chunks (via SSE). The frontend parses these streams and relies on `useState` combined with `useEffect` to instantly render predictable, interactive AI UI components. We explicitly reject the `useOptimistic` anti-pattern for SSE streaming, as it is designed for optimistic mutations, not continuous event streams.
- **The Deferred Render Pattern (SSE Architecture):** High-frequency SSE token ingestion must **never** use `useSyncExternalStore`, as it forces synchronous renders and defeats React 19's concurrent scheduler. Furthermore, `use()` is designed for unwrapping Promises, not continuous event emitters. Instead, connection lifecycles must be managed via `useEffect` (with `AbortController` cleanup). Token accumulation must be stored in standard `useState`, and the rendered markdown output must strictly be wrapped in `useDeferredValue(text, '')`. Crucially, you MUST pass the `initialValue` argument (`''`) to `useDeferredValue` to prevent server-side rendering (SSR) hydration mismatches. This allows React to drop intermediate heavy renders when tokens arrive faster than the main thread can paint, preventing UI lock-ups.

## Strategic Architectural Constraints: AI-Native Reliability & React 19 Parity

To ensure the NicheAI frontend remains resilient, easy for AI agents to reason about, and aligned with modern React 19 paradigms, all frontend execution must adhere to the following architectural constraints:

**1. Strategic Abstraction (DRY for Primitives, WET for Layouts)**

- **DRY Primitives:** Core UI building blocks must be strictly abstracted. Ban raw HTML `<button>` elements. Enforce a unified `<Button>` abstraction with internal promise resolution for `onClick`, default `type="button"`, and Radix UI compatibility. In React 19, pass `ref` directly as a prop (deprecating `forwardRef`). Additionally, the `<Button>` component MUST internally consume `useFormStatus().pending` to handle its own disabled and loading states automatically. This ensures AI agents do not have to manually bind loading state props during scaffolding, providing a bulletproof, predictable foundation for code generation.
- **WET Layouts:** Feature-specific layouts and complex page compositions should embrace duplication (Write Everything Twice). Isolated, WET layouts allow AI agents to iterate rapidly without the risk of unintended blast-radius regressions across other pages.

**2. Bimodal State Management & The Colocated Reality**

- **Declarative Data Fetching:** Leverage React 19's `use()` and `<Suspense>` boundaries strictly for one-off asynchronous Promises (server-state).
- **Discriminated Unions for Local State:** Strictly type complex local states using TypeScript Discriminated Unions. This guarantees mutually exclusive states, making it impossible for the AI to introduce invalid UI conditions (e.g. boolean soup).
- **The Pure Logic Extraction Boundary:** Zod schemas, data transformations, and pure utility functions MUST live in sibling files (e.g., `*.logic.ts`). However, ALL React hooks (including `useActionState`, `useDeferredValue`) and local state remain in the `.tsx` file. This keeps the component flat (< 300 lines) to ensure AI agents can navigate AST updates without context exhaustion.

**3. React 19 & Radix UI Paradigms**

- **Idiomatic React 19 Contexts:** Inter-Component logic must use React Context. Strictly split React Contexts (separating state and dispatch). Utilize React 19's ability to use `<Context>` directly as a provider instead of `<Context.Provider>`.
- **Native Metadata Hoisting:** Never use third-party libraries (e.g., `react-helmet`). Leverage React 19's native metadata hoisting (rendering `<title>`, `<meta>` directly inside any colocated component).
- **Tailwind v4 Native Radix Targeting:** Use Tailwind v4 natively to target Radix UI state attributes (e.g., `data-[state=open]:opacity-100`) avoiding complex third-party variants.
- **React 19 Action Awareness:** Favor top-level `useActionState` or `useTransition` within the single colocated component to maintain a flat file structure. Only use `useFormStatus` inside localized child components if component splitting is absolutely necessary.

**4. State Machine Gating (Pre-Release Polish & A11y)**

- **A11y Fallback & Progression:** Use the correct primitives from the first token generated. Use a **Bifurcated Disabled Rule**: Native `disabled` for standard controls (Buttons, Inputs) to leverage React 19's auto-disabling, and `aria-disabled="true"` with Radix's `data-disabled` styling hooks for composite Radix widgets (Selects, Tabs).
- **The "Self-Sufficient Primitive" Rule:** All interactive form primitives must inherently manage their own localized loading/error visual states. Require React 19 `useId()` to inherently link the `<label>`, `<input>`, and `<span role="alert">`. As part of this self-sufficiency, core inputs and buttons MUST automatically tap into contextual loading states (e.g., via `useFormStatus().pending`) to eliminate manual prop-drilling by AI agents.
- **Focus Management Post-Stream:** When an SSE stream finishes generating, dynamic UI must include deterministic focus management (e.g., auto-focusing the generated result) using React 19 standard `ref` props.
- **Performance Troubleshooting:** CPU profiling (`browser_profile_start/stop`) is a reactive playbook reserved exclusively for investigating reported performance bottlenecks, not a proactive scaffolding blocker. Filter out React internal scheduling frames (`performConcurrentWorkOnRoot`).
- **OKLCH Contrast Guards:** Text and background lightness must mathematically guarantee WCAG AA contrast minimums (`ΔL >= 0.50`) defined in the CSS `@theme` block. This is a pre-release gate.

**5. Testing & CI Resilience**

- **Strict Mocking Boundaries:** Fully mock `@radix-ui/*` primitives with `children` passthroughs or simple visible `div`s. Their internal CSS animations and async loops inherently conflict with Vitest `vi.useFakeTimers()`.
- **Firebase Mocking:** When mocking Firebase Firestore, ensure `getFirestore` and `initializeFirestore` return an object (`vi.fn(() => ({}))`).
- **Local Auth Bypass:** For E2E UI testing, NEVER execute full Firebase UI login flows. Append `?mock_auth=true` to the URL to natively bypass Firebase Auth listeners using our built-in E2E Test Mode, ensuring "Time-to-Green" testing speed.
- **React 19 Test Paradigms:** When testing components consuming SSE streams or Promises via `<Suspense>`, you MUST wrap the initial RTL `render()` call AND every subsequent stream injection in `await act(async () => { ... })`.

## Execution Plan

1. **State Milestone 1: Component Scaffolding & Visual Thesis**
   - Create `.cursor/prompts/ui-scaffold.md` defining the XML-based structure for LLM parsing.
   - Enforce dynamic context injection (reading `design-tokens.json` manifest).
   - Require a `<design_system_mapping>` block to translate the abstract Visual Thesis into explicit positive layout primitives (Tailwind v4 tokens).
   - Scaffold the UI focusing ONLY on the **Success (Happy Path)** and **Loading Skeleton** states initially.

2. **State Milestone 2: Logic Wiring & Connection Management**
   - Inject business logic using the defined **Pure Logic Extraction Boundary**.
   - Wire `useActionState` for forms and React 19 AbortControllers for fetch requests (hooked to tenant/workspace dependencies like `workspaceId` to prevent "Snapshot Beats the Fetch" race conditions).
   - For components needing AI text streaming, implement the connection lifecycles via `useEffect` with `AbortController` cleanup.

3. **State Milestone 3: Concurrent Rendering Optimization**
   - Ensure high-frequency SSE token accumulation is passed through `useDeferredValue()` to prevent main-thread UI lock-ups.
   - Apply progressive state enhancements (Error, Empty, Partial states) using Discriminated Unions.
   - Enforce pre-release gating (OKLCH contrast validation, ARIA focus management, and Bifurcated Disabled attributes).

4. **State Milestone 4: Intent Validation & Coverage Reporting**
   - Execute Functional UI tests using RTL + MSW, ensuring strict mocking boundaries (Radix passthroughs). To verify async deduplication and bypass JSDOM `pointer-events` blockages, tests MUST simulate rapid double-clicks using synchronous `fireEvent.click()` instead of `userEvent.click()`.
   - Execute E2E intent validation via Playwright and Firebase Emulators (using `?mock_auth=true` bypass).
   - Update `README.md` to integrate this new pipeline and update `AGENTS.md` with the documented boundaries.
