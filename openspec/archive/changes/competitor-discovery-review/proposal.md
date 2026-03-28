# Proposal: Competitor Discovery Review Flow

## Why

Founders often struggle to define their exact competitors, leading to empty or bloated, irrelevant lists. Currently, the system automatically discovers competitors in the background during the deep validation process, denying the user the ability to review, prune, or understand the landscape before committing to an expensive deep analysis.

## What Changes

This feature intercepts the deep validation trigger and introduces a synchronous Human-in-the-Loop (HITL) Competitor Curation step. It discovers competitors first, presents them with an explainable AI rationale, and allows the user to explicitly keep or discard suggestions before the campaign runs.

## Capabilities

- **Upfront Discovery**: Creates a new `/api/campaign/discover-competitors` endpoint using Exa search and Gemini Flash.
- **Explainable Scoring**: Provides a 3-factor evaluation (Job-to-be-Done, Audience, Mechanism) with a similarity score and match tier (Direct, Adjacent, Legacy).
- **HITL Curation**: A 'Reverse Demo' modal where users curate their competitive landscape with simple binary actions (Keep/Discard).
- **Data Flywheel**: Captures explicit user intent to refine future matching.

## Impact

- Prevents deep, expensive analysis on the wrong targets (reduces 'garbage-in, garbage-out').
- Demonstrates immediate AI value through pre-populated, high-quality results.
- Empowers founders to understand why tools are considered competitors through explainable rationale.
