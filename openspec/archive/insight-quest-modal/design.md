## Context

The `InsightQuestModal` was developed as a solution to "Insight Fatigue." When the AI engine generates 50+ insights across competitors, founders and strategists struggle to rank them on an absolute scale (1-10). Comparing two items relatively (A vs. B) is cognitively simpler. To make this even more engaging, it was wrapped in a gamified farming metaphor ("harvesting crops" vs. "composting") and a Matrix-pill selection metaphor to initiate the game.

## Goals / Non-Goals

**Goals:**

- Guide the user through a narrative-driven micro-session (Intro, Name, Pill, Game, Outro).
- Present two random insights side-by-side for comparison.
- Limit the session to 3 rounds.
- Use engaging UI elements (Lucide icons, Framer Motion animations, Typewriter text).

**Non-Goals:**

- Implementing the actual backend Elo rating system (this modal only provides the UI mechanism and `onRankInsight` callback).
- Replacing the standard data grid for power users who want bulk actions.

## Decisions

**1. A/B Comparison Model over Absolute Ranking**

- **Decision**: Users are presented with two insights (Crop A vs. Crop B) and must pick the better one.
- **Rationale**: Relative ranking is much lower cognitive load.
- **Alternatives Considered**:
  - _Star rating (1-5)_: Too subjective and inconsistent.
  - _Drag and Drop List_: Overwhelming when dealing with dozens of items.

**2. Farming Metaphor UI**

- **Decision**: Wrap the standard B2B workflow in a whimsical "Valley of Insights" metaphor with Sprout, Sun, and Leaf icons.
- **Rationale**: Makes a dry strategic planning workflow engaging and reduces stress.
- **Alternatives Considered**:
  - _Corporate B2B UI_: Safe, but boring and doesn't solve the core problem of engagement fatigue.

**3. Fixed Session Length**

- **Decision**: Cap the game at 3 rounds per session (`maxRounds = 3`).
- **Rationale**: Prevents the game from feeling like an endless grind and ensures users reach the satisfying "Outro" screen.

## Risks / Trade-offs

- **Risk: Tonal Clash** -> The whimsical farming metaphor might clash with serious enterprise strategy contexts.
- **Mitigation**: The feature is optional (an alternative entry point, usually triggered via a "Quest" button) and doesn't replace the serious data grids.
