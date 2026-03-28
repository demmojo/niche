---
name: niche-pdlc-evolution
overview: A phased refactor to unify Niche's UX into an intent-based command center, integrating hybrid AI orchestration and automated visual validation.
todos: []
isProject: false
---

# Niche PDLC & UX Evolution Plan

## Phase 1: ML System Audit & Hybrid Orchestration

- Audit the existing `aiClient.ts` to map current AI usage. Keep it intact for fast, direct, and cost-sensitive LLM queries.
- Integrate `smolagents` for lightweight, sandboxed UI and logic generation tasks where speed and token-efficiency are paramount.
- Scaffold a background task queue optimized for `CrewAI` to handle complex, multi-agent market intelligence research asynchronously, protecting the user-facing latency.

## Phase 2: UX Unification & Design System

- Establish an intent-based "Command Center" UI layout utilizing progressive disclosure: _Overview_ (Monitoring) → _Focus_ (Triage) → _Action_ (Execution).
- Integrate Figma Context MCP to extract current typography and layouts, creating a unified heuristics file to guide all future AI UI generation.
- Refactor existing complex dashboards to use RAG (Red/Amber/Green) thresholds and cap metrics per view to strictly manage cognitive overload (max 7±2 data chunks).

## Phase 3: Prototyping & Visual Validation Pipeline

- Set up MCP-UI to allow for interactive component rendering inside the developer workspace during the brainstorming and specification phases.
- Integrate `Browser-Use` into the CI/CD pipeline or local testing suite to autonomously click through new features, validating cognitive load, layout stability, and intuitive flows.

## Phase 4: Continuous UI Adaptation

- Implement lightweight behavioral telemetry that tracks frequent user actions (e.g., dismissing specific AI alerts, recurring navigation paths).
- Create a scheduled background job that analyzes this telemetry to dynamically adjust default UI postures, generative UI densities, and trust-building explainable AI states.
