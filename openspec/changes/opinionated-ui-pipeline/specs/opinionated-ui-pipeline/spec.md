# Specification: Pipeline Rules & Behaviors

## Detailed Features

### 1. The `ui-scaffold.md` Prompt Engine
An XML-structured prompt engineered for LLM instruction parsing (Claude 4.6) enforcing structural and stylistic constraints.

**Scenario: Scaffolding a Dynamic Component**
- **WHEN** an agent is asked to create a dynamic component (e.g., a data table or AI chat).
- **THEN** it must output a `<thought>` block evaluating its dynamic nature.
- **AND** it must output a `<visual_thesis>` block anchoring the aesthetic (rejecting generic layouts).
- **AND** it must generate React code handling the 5 interaction states (loading, empty, error, success, partial).
- **AND** it must utilize React 19 AbortControllers for associated data fetching.

**Scenario: Scaffolding a Static Component**
- **WHEN** an agent evaluates a component as Static inside the `<thought>` block.
- **THEN** it must intentionally ignore the 5-state rule to prevent codebase bloat.

### 2. The Colocated Structure Constraints
**Scenario: Handling Complex Business Logic inside Colocated Files**
- **WHEN** an agent writes complex business logic within a single-file Colocated Component.
- **THEN** the agent must extract this logic into pure functions declared outside the React component boundary.

### 3. Explainable Accessibility
**Scenario: Generating AI interaction states**
- **WHEN** generating a loading, partial, or streaming state.
- **THEN** the agent must enforce `aria-live="polite"` and generate text-explainable states rather than relying exclusively on generic spinner SVGs.