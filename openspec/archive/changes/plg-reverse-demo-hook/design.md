# Design

## Context

The reverse demo hook is a crucial PLG entry point, but UI friction, state loss, and performance penalties are dropping conversion rates. Users experience layout shifts, context loss during auth, modal fatigue, and redundant wait times post-login.

## Goals

- Eliminate CLS during the streaming phase.
- Persist state across page refreshes and the auth boundary.
- Preserve user context using side drawers instead of blocking modals.
- Improve cognitive load using structured Generative UI.
- Eliminate redundant post-auth LLM latency.

## Non-Goals

- Changing the underlying AI model providers (Gemini/Exa).
- A full redesign of the authenticated workspace application.
- Changing the core authentication provider.

## Decisions

1. **Generative UI:** Transition from raw markdown text streaming to discrete React components pushed via stream for documents.
2. **Side Drawers:** Use a persistent right-side drawer pattern to keep the main dashboard visible behind complex configurations.
3. **Caching Strategy:** Cache unauthenticated anonymous LLM responses on the Express BFF keyed by an anonymous intent ID. Pass this ID via URL parameters through the PQL gate to instantly hydrate upon login.
4. **Inverted Flow:** Ask for document format _before_ curation to avoid the 'False Choice' trap.

## Risks & Trade-offs

- **Backend Cache Bloat:** Caching anonymous responses on the BFF requires aggressive TTLs to prevent memory bloat/Redis capacity issues.
- **Complexity in GenUI Stream:** Parsing structured components from an LLM stream is more complex and error-prone than appending raw markdown characters.

## Future Potential

- Expand Generative UI into fully interactive block-based editors (similar to Notion).
- Implement real-time multiplayer collaboration on the generated specs.
