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

- **The Core Local Workflow:** The primary workflow is not an external "Walled Garden" of premium subscriptions. The primary pipeline relies on centralizing our constraints into local `.cursor/prompts` to guide local IDE agents (Cursor/Windsurf). External tools (v0, Stitch) are *optional* Day 1 accelerators.
- **The "Colocated Components" Reality:** We explicitly reject over-engineering human abstractions (like strict Container/Presenter or Slot composition) that fight LLM tendencies. LLMs excel at generating cohesive, colocated files (UI + localized state together). Forcing them into strict inversion of control causes hallucination.
- **The "One-Way Trip" vs "Halt & Update":** Because we allow colocated components, sending a component back to v0 on "Day 2" is destructive. Once business logic (Firebase/Zustand) is injected, all future iterations must happen locally in Cursor using AST-aware diffing or focused Claude 4.6 editing.

## The Proposed Pipeline (To be added to README.md)

We will introduce a new section: **NicheAI’s Opinionated UI Pipeline (The Anti-Slop MLP Stack)**.

### Phase 1: Visual Thesis & IA (The "Why" and "Where")
- **Action:** Define a 1-sentence **Visual Thesis** (mood, typography, composition) and map the **Information Architecture**.
- **Constraint (Functional Design Thinking):** Ban generic SaaS layouts (e.g., 3-column feature grids) unless explicitly backed by a user JTBD. Avoid purple-on-white defaults.
- **Tooling:** Freeform text, or optionally Google Stitch 2.0 / Figma for "Vibe Design".

### Phase 2: Structural Scaffolding (The Core Local Workflow)
- **Action:** Scaffold components using NicheAI's centralized prompts (to be added as `.cursor/prompts/ui-scaffold.md`).
- **Constraint (YAGNI & 5-State Rule):** For *dynamic zones* (data tables, forms, AI chats), the prompt must generate all 5 interaction states (loading, empty, error, success, partial). For static components, ignore this to prevent codebase bloat.
- **Tooling:** Cursor / Windsurf Agent. (Optional Premium: Paste the prompt into v0 or Lovable).

### Phase 3: Logic Wiring & The "Day 2" Iteration
- **Action:** Wire up business logic (Zustand, Firebase) and handle ongoing maintenance.
- **Constraint (The Colocated One-Way Trip):** Once business logic is injected, the component is locked to the local IDE. External scaffolding tools will overwrite the logic.
- **Constraint (Accessibility):** AI-generated states must be explainable. Enforce `aria-live="polite"` instead of generic spinners.
- **Tooling:** Cursor / Windsurf. Use Claude 4.6 for complex React 19 logic compilation, and Gemini 3.1 Pro (via `cursor-ide-browser` MCP) for visual QA.

## Execution Plan

1. **Create `.cursor/prompts/ui-scaffold.md` (The Scaffolding Core):**
   - Implement a robust, XML-based structure optimized for LLM instruction parsing (Claude 4.6).
   - Require a `<thought>` block to evaluate if the component is Dynamic vs. Static.
   - Require a `<visual_thesis>` block to anchor the design aesthetically before writing code.
   - Enforce the **Colocated Components** pattern (UI + Logic in a single file) to minimize cognitive load and maximize LLM generation reliability (avoiding the "Split-Brain" problem).
   - Mitigate colocation risks via **Pure Functional Extraction**: mandate that complex business logic within the colocated file is extracted into pure, testable functions outside the React component boundary.
   - Enforce **React 19 AbortControllers**: require that all data fetching hooks and side-effects within the colocated component use AbortSignals to prevent race conditions ("Snapshot Beats the Fetch").
2. **Update `README.md`:** Integrate the new "NicheAI’s Opinionated UI Pipeline (The Anti-Slop MLP Stack)" section.
3. **Update `AGENTS.md`:** Document the "Colocated One-Way Trip", the XML prompt usage, and the YAGNI 5-State Rule to ensure autonomous agents adhere to these constraints and maintain the pure functional testing boundaries.
