## Why

The chat interface currently lacks an efficient way to reference specific entities (competitors, features, files, raw data, insights) directly in the conversation. Users need a way to seamlessly pull these entities into the context using `@` and `#` mentions. The autocomplete needs to be fast (<100ms), structured by categories, and the selected mentions need to act as atomic nodes. Additionally, injecting massive raw data payloads for every mention bloats the AI context window, leading to degraded reasoning and high costs.

## What Changes

A real-time, multi-category autocomplete mention system will be introduced into the chat interface using Tiptap for the rich-text editor and a Supabase federated search API. It will feature bi-directional tagging and AI context optimization via tiered progressive disclosure (sending summaries first, with tools to fetch full details).

## Capabilities

### New Capabilities

- `multi-category-mentions`: Type `@` or `#` to bring up a categorized autocomplete dropdown for entities.
- `bi-directional-tagging`: Tagging an entity automatically establishes a two-way relationship in the database.
- `progressive-ai-context`: Mentions inject lightweight entity summaries into the AI prompt, with a new tool allowing the AI to fetch full details only when necessary.

### Modified Capabilities

- `chat-interface`: Upgraded from a standard textarea to a headless Tiptap editor to support atomic mention nodes.

## Impact

This change affects the `InsightBrainstormChat` component, the AI client context generation, and the Supabase database schema (adding a new relationship table and search view/RPC).
