## Why

Current dashboards mix data presentation with active strategic work, causing cognitive overload. We need a clear separation between "Explanatory" dashboards (Presentation) and "Exploratory & Generative" workspaces (Analysis & Strategy), aligning with the new 2026 "Command Center" UI/UX strategy.

## What Changes

Introduce a unified **Analytical Template System** that routes users into two distinct flows:

1. **Presentation Templates**: Read-optimized, high-density visual dashboards (e.g., "Market Size by Competitor"). Focuses on Progressive Disclosure and Action-Oriented Design.
2. **Analysis & Strategy Templates**: Write-optimized, generative workspaces (e.g., SWOT, Lean Canvas). Focuses on Split-Pane Workflows and Agentic Assistance to prevent "Blank Page" fatigue.

## Capabilities

### New Capabilities

- `template-gallery`: A new visual gallery to select templates, categorized by Presentation vs. Strategy.
- `presentation-viewer`: A read-only, high-density dashboard renderer using the new Brutalist UI (Clash Display, JetBrains Mono, Deep Dark Mode).
- `strategy-workspace`: A split-pane interactive canvas (using CSS Grid and native inputs) for active data collection and AI-assisted synthesis.
- `generative-prefill`: AI-powered pre-filling of strategy templates to reduce data-entry friction, with strict output sanitization.

### Modified Capabilities

- `data-grids`: Updated to support specific use-cases for read-only Presentation charts and interactive Strategy input forms, built directly for their contexts rather than premature abstractions.

## Impact

- **Frontend:** Introduction of the new Brutalist design system, splitting the UI into two major analytical flows. Route-based code splitting ensures lightweight initial loads.
- **Architecture:** Transition to direct component builds (avoiding premature headless abstractions). Strict boundaries between client state (Zustand) and server state (direct fetching), utilizing debounced background saving without complex optimistic UI rollbacks.
