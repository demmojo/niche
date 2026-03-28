---
name: analytical-template-system
overview: Create OpenSpec files (proposal, design, tasks) for a new Analytical Template System that separates Presentation Templates from Analysis & Strategy Templates, applying the new Brutalist Command Center design system.
todos: []
isProject: false
---

# Analytical Template System OpenSpec Plan

## Research & Context

I reviewed the existing `openspec/changes/` and `docs/brainstorms/` directories. While there are brainstorms for a "Next-Gen Analytics Platform" and a new "UI/UX Strategy" (Brutalist Command Center), a specific proposal for an **Analytical Template System** split into "Presentation Templates" and "Analysis & Strategy Templates" has **not** been proposed yet.

I have run parallel research agents (simulating the `/deepen-plan` workflow) to gather industry best practices, performance patterns, and UI strategies. Here is the deepened plan for creating the OpenSpec files.

## 1. `openspec/changes/analytical-template-system/proposal.md`

### Why

Current dashboards mix data presentation with active strategic work, causing cognitive overload. We need a clear separation between "Explanatory" dashboards (Presentation) and "Exploratory & Generative" workspaces (Analysis & Strategy), aligning with the new 2026 "Command Center" UI/UX strategy.

### What Changes

Introduce a unified **Analytical Template System** that routes users into two distinct flows:

1. **Presentation Templates**: Read-optimized, high-density visual dashboards (e.g., "Market Size by Competitor"). Focuses on Progressive Disclosure and Action-Oriented Design.
2. **Analysis & Strategy Templates**: Write-optimized, generative workspaces (e.g., SWOT, Lean Canvas). Focuses on Split-Pane Workflows and Agentic Assistance to prevent "Blank Page" fatigue.

### Capabilities

- `template-gallery`: A new visual gallery to select templates, categorized by Presentation vs. Strategy.
- `presentation-viewer`: A read-only, high-density dashboard renderer using the new Brutalist UI (Clash Display, JetBrains Mono, Deep Dark Mode).
- `strategy-workspace`: A split-pane interactive canvas (using React Flow or structured grids) for active data collection and AI-assisted synthesis.
- `generative-prefill`: AI-powered pre-filling of strategy templates to reduce data-entry friction.

## 2. `openspec/changes/analytical-template-system/design.md`

### Architecture & Tech Stack

- **Framework:** React 19, Vite, TypeScript.
- **State Management:** Zustand (optimistic UI updates for Strategy Canvases).
- **Styling:** Tailwind CSS v4, transitioning away from "Fhibli UI" towards the new Brutalist aesthetic (Deep Slate, Chartreuse, Radical Red, Electric Cyan).
- **Visualization:** Recharts for Presentation dashboards; React Flow (`@xyflow/react`) for Strategy workspaces.

### UI/UX Implementation Details (Deepened Insights)

- **Split-Pane Workflow (Strategy):** Left pane for reference data/AI chat, right pane for the active structured canvas (e.g., Competitor Grid).
- **Progressive Disclosure (Presentation):** Top-level KPIs in F-Pattern layout. Clicking a KPI opens a modal drill-down to prevent cluttering the main view.
- **Constrained Interactivity:** Presentation templates will have macro-toggles (e.g., "Q1 vs Q2") rather than complex filter builders, ensuring executive readiness.
- **Headless Components:** We will decouple data fetching from visual charts using a headless approach, allowing the same backend data models to power both a read-only Presentation chart and an interactive Strategy input form.

### Performance Considerations

- **Presentation Caching:** Use aggressive frontend caching (SWR/React Query or Zustand persisted state) for Presentation templates since they are read-heavy.
- **Strategy Sync:** Strategy templates require debounced, background syncing to prevent blocking the main thread during active typing or dragging in the canvas.

## 3. `openspec/changes/analytical-template-system/tasks.md`

1. **Scaffold OpenSpec:** Create `proposal.md`, `design.md`, and `tasks.md`.
2. **UI Foundation:** Define the new Brutalist color palette and typography in Tailwind config (Clash Display, JetBrains Mono, Switzer).
3. **Template Gallery:** Build the selection UI distinguishing Presentation vs. Analysis & Strategy templates.
4. **Presentation Engine:** Build the `PresentationViewer` component with Recharts, implementing the F-Pattern KPI layout.
5. **Strategy Engine:** Build the `StrategyWorkspace` split-pane component using React Flow for structured canvases.
6. **Data Integration:** Connect the generative pre-fill logic to the Strategy Engine.
7. **Refinement:** Apply animations and "flash" state transitions as defined in the UI/UX strategy.
