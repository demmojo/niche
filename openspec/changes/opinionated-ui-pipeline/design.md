# Design: The Anti-Slop MLP Stack

## Context
The modern 2026 stack involves tools like Cursor/Windsurf, Gemini 3.1 Pro, Claude 4.6, and v0. Without an opinionated workflow, these tools independently generate bloated, fragmented, or generic components. We must orchestrate them deliberately.

## Goals
- Standardize the UI generation workflow across 3 explicit phases: Visual Thesis, Structural Scaffolding, and Logic Wiring.
- Centralize prompt constraints locally via `.cursor/prompts/ui-scaffold.md`.
- Ensure AI output prioritizes colocated React files optimized for LLM context windows.

## Non-Goals
- Building new proprietary UI generation pipelines from scratch.
- Mandating premium external tools (v0, Stitch, Lovable) as the only way to scaffold.

## Decisions
1. **Colocated Components**: We explicitly reject over-engineering human abstractions (like strict Container/Presenter). LLMs excel at generating colocated files.
2. **Pure Functional Extraction**: To keep colocated files manageable, complex business logic must be moved to pure, testable functions *outside* the React component boundary in the same file.
3. **React 19 AbortControllers**: Mandatory for all data fetching hooks and side-effects to prevent race conditions ("Snapshot Beats the Fetch").
4. **YAGNI & 5-State Rule**: Dynamic zones must explicitly generate all 5 interaction states (loading, empty, error, success, partial); static ones must not, to prevent bloat.
5. **The Colocated One-Way Trip**: Once business logic is applied locally, sending the component back to external UI generators (v0) is banned to prevent destructive overwrites.

## Risks & Trade-offs
- *Risk*: Colocated files might become too large for humans to quickly scan. *Mitigation*: The "Pure Functional Extraction" rule enforces a clean separation of pure logic vs React wiring.
- *Trade-off*: We lose the iterative visual generation power of external tools after Day 1. *Mitigation*: Rely heavily on Claude 4.6 AST-aware diffing and Gemini 3.1 Pro via `cursor-ide-browser` MCP for visual QA locally during Day 2 edits.