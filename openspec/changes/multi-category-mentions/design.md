## Context

The current chat input is a standard `<textarea>` which cannot support atomic non-editable nodes (like a pill for a mentioned competitor). Moreover, querying multiple tables (competitors, features, raw data, insights) for autocomplete from the frontend would cause severe N+1 latency. Finally, blindly injecting large linked documents into the AI's context window degrades performance ("Lost in the Middle" phenomenon) and increases token costs.

## Goals / Non-Goals

**Goals:**

- Implement a federated search API returning categorized results in <100ms.
- Replace `<textarea>` with Tiptap for rich-text, atomic mention nodes.
- Build a floating autocomplete UI with "Show More" drill-down functionality.
- Optimize AI context by injecting lightweight summaries instead of full payloads for mentioned entities.

**Non-Goals:**

- Implementing full fuzzy search (Levenshtein distance) across all entities (will rely on prefix/trigram matching).
- Refactoring the entire application to use Tiptap (only the chat interfaces where mentions are needed).

## Decisions

**1. Tiptap for Rich Text**

- **Decision**: Use Tiptap (built on ProseMirror) for the chat input.
- **Rationale**: Standard textareas cannot render atomic nodes (pills) or provide accurate cursor tracking for floating menus. Tiptap natively supports extensions for mentions and custom node views.

**2. Supabase Materialized View / RPC for Federated Search**

- **Decision**: Create a single Postgres `UNION ALL` view or RPC for global search, utilizing `pg_trgm` indexes.
- **Rationale**: Prevents N+1 API calls from the frontend and pushes the sorting/filtering to the database layer, drastically reducing latency.
- **Alternatives Considered**:
  - _Frontend Promise.all() to 5 tables_: Rejected due to high network latency and difficulty in cross-entity pagination/ranking.

**3. Tiered Progressive Disclosure for AI Context**

- **Decision**: When an entity is mentioned, only inject its ID, type, and a short summary into the base prompt. Give the AI a `get_full_entity_details` tool.
- **Rationale**: Prevents UI memory bloat and LLM token bloat. The AI can decide if it needs the full document.

## Risks / Trade-offs

- **Risk: Increased frontend complexity with Tiptap** -> Tiptap requires more setup than a textarea, and managing the floating UI state can be complex.
- **Mitigation**: Strictly scope Tiptap usage to the chat input and rely on headless UI libraries where possible to manage the floating popover.
