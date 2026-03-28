## Why

We need to evolve our strict hierarchical mindmap into a world-class visual knowledge management system inspired by tools like Heptabase and Scrintal. Users need the freedom to organize thoughts spatially, create multiple canvases for different contexts, and seamlessly interact with an AI brainstorming partner that can reference specific nodes.

## What Changes

1. **Multiple Whiteboards:** Users can create, name, and switch between multiple infinite-canvas whiteboards.
2. **Template Library:** Introduce 10 whiteboard templates (e.g., Competitor Analysis, Go-To-Market, SWOT) to kickstart workflows.
3. **Decoupled Cards:** Shift from "Nodes" to "Cards" that exist in a global library and can be placed on multiple whiteboards simultaneously.
4. **Bi-directional Links:** Connect cards visually using arrows (React Flow edges) and conceptually via tags or block-level references.
5. **Contextual AI Chat:** A side-by-side or dedicated AI chat view where users can "@mention" tags or cards to inject them as context. AI responses can be dragged onto the whiteboard as new cards.

## Capabilities

### New Capabilities

- `whiteboard-management`: Create, rename, delete, and switch between multiple whiteboards.
- `template-initialization`: Seed a new whiteboard with a predefined structure/layout.
- `global-card-library`: Store cards independently of whiteboards so they can be reused.
- `ai-context-injection`: Mention @tags or @cards in chat to pass specific knowledge to Gemini.

### Modified Capabilities

- `mindmap-explorer`: Replaced with a `reactflow`-powered infinite canvas supporting free-form spatial organization and bi-directional edges.

## Impact

- **State Management:** Complete refactor of `MindmapExplorer` state. The tree structure is replaced by normalized `cards`, `whiteboards`, and `edges` (junctions).
- **UI Architecture:** Introduces a side-panel or dedicated layout for simultaneous Whiteboard + AI Chat viewing.
- **Dependencies:** Requires introducing `@xyflow/react` (React Flow) for canvas rendering.
