# Architecture Documentation

This directory contains the macro-architecture documentation for the NicheAI platform.

## Structure

- **[`decisions/`](./decisions/)**: Global Architecture Decision Records (ADRs). Follows the MADR (Markdown Architectural Decision Records) format.
  - [001-context-bound-zustand.md](./decisions/001-context-bound-zustand.md)
  - [002-app-decomposition.md](./decisions/002-app-decomposition.md)
  - [003-ai-client-sequence.md](./decisions/003-ai-client-sequence.md)
- **[`concepts/`](./concepts/)**: Cross-cutting engineering concepts and system-wide patterns (e.g., state-management, auth-flow, routing).
- **[`data-models/`](./data-models/)**: Global domain entities, Firestore schemas, and system boundaries.
- **[`diagrams/`](./diagrams/)**: C4 Models or Mermaid diagrams representing the high-level architecture.

## Writing Guidelines

- **Micro vs Macro**: If a document only applies to a specific feature, it belongs in that feature's `openspec/changes/<feature-name>/` directory. This `docs/architecture/` folder is strictly for **global**, cross-cutting concerns.
- **TSDoc Standard**: Do not document component-level details here. Use TSDoc directly in the source code for utility functions, interfaces, and React components.
- **Decisions**: Use the MADR template for ADRs to ensure historical context and rejected alternatives are preserved.
