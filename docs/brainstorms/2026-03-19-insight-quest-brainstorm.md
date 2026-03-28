# Brainstorm: Gamified Insight Ranking (InsightQuestModal)

**Date**: 2026-03-19

## What We're Building

A gamified ranking interface called `InsightQuestModal` designed to help users prioritize and rank auto-generated market insights without experiencing decision fatigue. The interface uses a whimsical "farming" metaphor ("Valley of Insights") where insights are "crops" to be harvested or composted.

## Why This Approach?

Users are generating hundreds of strategic insights via the AI engine. Presenting them in a standard data grid or list leads to cognitive overload and "insight fatigue". By gamifying the ranking process into a Tinder-style A/B comparison (Elo rating system backend compatibility), users can rapidly process and prioritize insights through rapid micro-decisions.

## Key Decisions

1. **A/B Comparison Model**: Rather than asking users to score an insight 1-10, we present two insights and ask them to choose the "better" one. This relative ranking is much lower cognitive load.
2. **Farming Metaphor**: Thematic UI (Sprouts, Sun, Wheat) makes a traditionally dry B2B SaaS workflow more engaging and reduces the stress of strategic planning.
3. **Micro-Sessions**: The game is capped at 3 rounds per session (`maxRounds = 3`) to ensure it remains a quick, enjoyable break rather than an endless grind.
4. **Typewriter Text & Animation**: Framer Motion and custom typewriter effects slow the user down slightly during intro phases, building anticipation and ensuring they read the instructions before rapid-fire clicking.

## Open Questions

None at this time. This is a retroactive documentation brainstorm capturing the design decisions of an already implemented feature.
