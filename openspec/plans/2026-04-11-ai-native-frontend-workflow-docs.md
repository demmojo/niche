---
title: Update Documentation with NicheAI's Opinionated UI Pipeline
status: draft
dependencies: []
---

# Proposal: NicheAI’s Opinionated UI Pipeline (The Anti-Slop MLP Stack)

## Context & Objective

As the AI-native development ecosystem evolves in 2026, the primary challenge for frontend engineering is no longer speed, but avoiding "regression to the mean"—the homogenization of design often referred to as "AI Slop."

We need to formalize NicheAI’s opinionated frontend development workflow in our `README.md` and developer onboarding documentation. This update will guide contributors on how to orchestrate the modern 2026 stack (Stitch, v0, Cursor/Windsurf, Gemini 3.1 Pro, Claude 4.6) while avoiding the critical traps of "Toolchain Fatigue" and the "Day 2 Maintenance Problem."

## Strategic Alignment (Product & Design Lens)

- **The Audience:** This pipeline is explicitly an _internal engineering standard_ for NicheAI contributors, not a mandatory toolchain for our founders.
- **Identity:** NicheAI rejects generic AI outputs. We enforce a Minimum Lovable Product (MLP) standard that relies on strict aesthetic constraints and functional design thinking.
- **Information Architecture:** The pipeline mandates that Information Architecture (IA) and Core Flows are mapped _before_ any code generation occurs.

## The Proposed Pipeline (To be added to README.md)

We will introduce a new section: **NicheAI’s Opinionated UI Pipeline (The Anti-Slop MLP Stack)**.

### Phase 1: Visual Thesis & IA (The "Why" and "Where")

- **Action:** Before generating code, contributors must define a 1-sentence **Visual Thesis** (mood, typography, composition) and map the core **Information Architecture**.
- **Constraint (Anti-Slop):** Do not rely on banning specific fonts to avoid slop. Enforce _Functional Design Thinking_. Ban generic SaaS layouts (e.g., 3-column feature grids) unless explicitly backed by a user metric/JTBD.
- **Tooling:** Google Stitch 2.0 or Figma for "Vibe Design" and structural wireframing.

### Phase 2: Structural Scaffolding (Day 1 Generation)

- **Action:** Use component-first generators to create "dumb" presentation components.
- **Constraint (YAGNI & 5-State Rule):** For _dynamic zones_ (data tables, forms, AI chats), explicitly prompt the generator for all 5 interaction states (loading, empty, error, success, partial). For static components, ignore this to prevent codebase bloat.
- **Tooling:** v0 (Vercel) or Lovable. _Note: These are optional accelerators. Contributors without premium access can manually scaffold._

### Phase 3: Logic Wiring & The "Day 2" Iteration Loop

- **Action:** Wire up business logic (Zustand, Firebase) and handle ongoing maintenance.
- **Constraint (The One-Way Trip):** Once business logic is injected into a component, **you must never return it to the scaffolding tool (v0)**. Doing so risks overwriting logic with hallucinated states. All future UI iterations must happen locally.
- **Constraint (Accessibility):** AI-generated states must be explainable. Enforce `aria-live="polite"` instead of generic spinners.
- **Tooling:** Cursor / Windsurf. Use Claude 4.6 for complex React 19 logic compilation, and Gemini 3.1 Pro (via `cursor-ide-browser` MCP) for Visual QA against the original Visual Thesis.

## Adversarial Safeguards Included

- **Preventing "Hipster Slop":** We recognize that arbitrarily banning "purple-on-white" or the "Inter" font just creates a different flavor of slop. The documentation emphasizes structural purpose over superficial bans.
- **Contributor Accessibility:** The documentation explicitly frames premium tools (v0, Stitch) as _optional accelerators_, ensuring developers on free tiers are not locked out of contributing.

## Execution Plan

1. Update `README.md` with the new section.
2. Append a condensed version of these constraints to `AGENTS.md` so autonomous agents executing `frontend-design` tasks adhere to the "One-Way Trip" and "YAGNI 5-State" rules.
3. Review against the OpenSpec CI/CD guidelines to ensure no CLI commands are broken.
