## Why

The application automatically generates large volumes of strategic insights based on competitor data. Users need a way to filter, rank, and prioritize these insights. A standard list or grid view causes decision fatigue and cognitive overload, making users less likely to review the insights they generated.

## What Changes

We are documenting the implementation of the `InsightQuestModal`, a gamified, Tinder-style A/B testing interface wrapped in a whimsical "farming" metaphor ("Valley of Insights"). Users enter a micro-session where they choose the best of two insights across 3 rapid-fire rounds, providing implicit ranking data to the system.

## Capabilities

### New Capabilities

- `gamified-insight-ranking`: An interactive modal that guides users through a narrative flow (Intro -> Name -> "Pill" Selection -> Game -> Outro) to rank insights relative to one another.
- `micro-session-engagement`: Limits engagement to 3 rounds (`maxRounds = 3`) to ensure high completion rates and prevent burnout.

### Modified Capabilities

- `insight-management`: Enhanced by providing a fun alternative to manual table sorting or bulk deletion.

## Impact

This impacts the `InsightLibrary` (or `MarketAnalysis`) view, providing an alternative entry point for users to engage with their generated insights. It utilizes Framer Motion for complex sequenced animations and custom hooks for typed text effects.
