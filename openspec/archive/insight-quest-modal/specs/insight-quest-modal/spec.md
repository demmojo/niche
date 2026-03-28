# Insight Quest Modal

The `InsightQuestModal` is a gamified ranking interface that presents users with two auto-generated strategic insights side-by-side, asking them to choose the "better" one (thereby implicitly ranking them). It uses a whimsical farming metaphor ("Valley of Insights") to reduce the cognitive load of strategic planning.

## Features

### 1. Narrative Flow

- **Requirement:** The modal must guide the user through a 5-step flow: `intro` -> `name` -> `pill` -> `game` -> `outro`.
- **Requirement:** The `intro`, `name`, `pill`, and `outro` steps must use a custom `TypewriterText` component that types out instructions one character at a time. The user cannot proceed until the text finishes typing.

### 2. Insight Selection

- **Requirement:** The `game` step randomly selects two different insights from the `insights` prop (`insightA` and `insightB`).
- **Requirement:** A random game mode (1: Spring Harvest, 2: Summer Festival, 3: Autumn Fair) determines the prompt text and UI colors.

### 3. Ranking Callback

- **Requirement:** When the user clicks an insight, `handleChoice` is called. The chosen insight is the `winnerId`, and the other is the `loserId`.
- **Requirement:** The modal must call `onRankInsight(winnerId, loserId)` to pass the data back to the parent component for long-term storage or Elo rating adjustments.

### 4. Session Limits

- **Requirement:** The game is capped at 3 rounds (`maxRounds = 3`). After the third choice, the flow moves to the `outro` step.

## Scenarios

- **WHEN** the user opens the modal
- **THEN** they see a bouncing sprout icon and typewriter text welcoming them to the Valley of Insights.

- **WHEN** the user enters their name and hits Enter
- **THEN** they progress to the red/blue pill selection screen (with crop themes).

- **WHEN** the user is presented with two insights in the `game` step and clicks one
- **THEN** `onRankInsight` is fired, and the round counter increments. If `roundsPlayed` < 3, new insights are loaded. If `roundsPlayed` >= 3, the `outro` step appears.

- **WHEN** there are fewer than 2 insights available to compare
- **THEN** the game skips to the `outro` step early.
