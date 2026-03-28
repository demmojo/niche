# Multi-Category Mentions

This specification outlines the requirements and user flows for the multi-category autocomplete mention system in the chat interface.

## Features

### 1. Database & Federated Search

- **Requirement:** A polymorphic `entity_relationships` table to store bi-directional tags.
- **Requirement:** A Supabase RPC or view (`global_search`) that aggregates `id`, `title`, `type`, and `excerpt` from `competitors`, `features`, `files`, `raw_data_library`, and `insights`.
- **Requirement:** Fast text search via `pg_trgm` indexes.

### 2. Tiptap Editor Integration

- **Requirement:** Replace the `InsightBrainstormChat` textarea with Tiptap.
- **Requirement:** Custom NodeView for mentions that stores `{ id, type, label }` and renders as an atomic pill.

### 3. Floating Autocomplete UI

- **Requirement:** Group search results by category with distinct icons.
- **Requirement:** Show a maximum of 3 results per category initially.
- **Requirement:** A "Show More" list item that slides the view to a single, paginated list for that category, with a sticky "← Back to all" header.
- **Requirement:** 150ms debounce with `AbortController` for stale request cancellation.

### 4. AI Context Optimization

- **Requirement:** Mentions injected into the AI prompt should resolve to short summaries (Tier 1).
- **Requirement:** The AI must be provided with a `get_full_entity_details(id, type)` tool to fetch complete payloads if needed (Tier 2).

## Scenarios

- **WHEN** a user types `@` in the chat input
- **THEN** a floating popover appears showing recent/top entities grouped by category.

- **WHEN** a user clicks "Show More" under the "Competitors" category
- **THEN** the popover transitions to a single list of competitors with a sticky "Back" button, maintaining text input focus.

- **WHEN** a user selects a mention from the list
- **THEN** an atomic pill is inserted into the editor, and a trailing space is added.

- **WHEN** a user submits a chat message containing a mention pill
- **THEN** the backend injects a short summary of the entity into the AI prompt, reducing token bloat.
