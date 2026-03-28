## Context

Currently, the `MindmapExplorer` is built using a strict D3 hierarchical tree. Modifying it requires recursive traversal, and nodes cannot easily link bi-directionally. This structure restricts users who want to brainstorm fluidly. Inspired by Heptabase and Scrintal, we're transitioning to an infinite canvas model with decoupled cards.

## Goals / Non-Goals

**Goals:**

- Transition to a flattened, normalized state for cards and edges.
- Support multiple distinct whiteboards per project.
- Implement a 10-template library for quick-starting whiteboard sessions.
- Allow AI chat to access specific cards/tags as context using `@mentions`.
- Allow AI generated insights to be saved directly back to the active whiteboard.

**Non-Goals:**

- Real-time multiplayer collaboration (CRDTs) is out of scope for this iteration.
- We will not migrate the entire app layout to a canvas; this only applies to the Mindmap/Whiteboard feature.

## Decisions

**1. Normalized State Architecture**

- **Decision**: Separate data into `cards` (global pool), `whiteboards` (contain lists of card IDs and their spatial X/Y coordinates), and `edges` (connections between cards on a specific whiteboard).
- **Rationale**: This is the "Heptabase model" that allows a single card (e.g., a note on a competitor) to appear on a "Competitor Analysis" board and a "Go-To-Market" board simultaneously without duplicating data.

**2. React Flow for Rendering**

- **Decision**: Replace D3 tree layout with `@xyflow/react`.
- **Rationale**: React Flow is the industry standard for node-based UIs in React, providing built-in minimaps, zooming, panning, and customizable nodes via foreignObjects.

**3. The 10 Core Templates**

- **Decision**: We will support templates for: Competitor Analysis, Product Design, Feature Analysis, Gap Analysis, SWOT Analysis, User Journey Mapping, Go-To-Market Strategy, Root Cause Analysis (5 Whys), Lean Canvas / Business Model, Content Strategy Architecture.
- **Rationale**: These 10 templates cover the vast majority of our target users' strategic brainstorming needs.

## Risks / Trade-offs

- **Risk: Performance degradation with too many nodes.** -> React Flow can struggle with thousands of DOM nodes.
- **Mitigation**: We will utilize React Flow's built-in viewport culling and only render the standard UI when zoomed in, dropping to simplified representations if necessary.
- **Risk: Migration of existing user data.** -> Existing hierarchical D3 data might break.
- **Mitigation**: Write a one-time migration utility that flattens existing D3 trees into the new `cards` + `whiteboards` schema, preserving parent-child relationships as visual edges.
