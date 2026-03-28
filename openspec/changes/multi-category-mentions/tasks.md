## 1. Database & API

- [ ] 1.1 Create Supabase migration for `entity_relationships` table.
- [ ] 1.2 Create Supabase migration for `global_search` RPC/View with `pg_trgm` indexes.
- [ ] 1.3 Implement the federated search API endpoint (e.g., `GET /api/search/mentions`) with AbortController support.

## 2. Frontend Editor & UI

- [ ] 2.1 Add Tiptap dependencies to the project.
- [ ] 2.2 Replace `<textarea>` in `src/components/InsightBrainstormChat.tsx` with Tiptap.
- [ ] 2.3 Create a custom Tiptap Mention extension and NodeView for atomic pills.
- [ ] 2.4 Build the floating autocomplete UI component with category grouping.
- [ ] 2.5 Implement the "Slide-In Drill-Down" interaction for the "Show More" button.
- [ ] 2.6 Connect the UI to the federated search API with a 150ms debounce.

## 3. AI Context Integration

- [ ] 3.1 Update the backend/AI client to resolve mention IDs to Structured Entity Summaries before sending the prompt.
- [ ] 3.2 Add the `get_full_entity_details` function declaration (tool) to the AI models.
- [ ] 3.3 Ensure bi-directional linking is saved when new insights are generated containing tags.
