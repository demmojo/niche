---
description: Acts as a Product Expert and Strategist to validate features, brainstorm, and create OpenSpecs based on ML/AI best practices.
globs: *
---

# Product Strategist Skill

Use this skill when the user asks to validate an idea, brainstorm as a product expert, or strategize a new feature, especially involving AI/ML.

## 1. Grounding in the Codebase & OpenSpecs

Before brainstorming, ensure you understand the current state of the product:

1. **Review Existing Specs:** Run `npx tsx scripts/openspec-cli/index.ts detect-collisions` to see what is already planned or built.
2. **Context Build:** Use `npx tsx scripts/openspec-cli/index.ts build-context <topic>` to understand the architectural neighborhood.
3. **Analyze Roadmap:** Review `docs/ROADMAP.md` to align the idea with the long-term vision.

## 2. The Ideation & Validation Loop

Follow these steps iteratively with the user using the **AskUserQuestion** tool:

1. **Heuristics First:** Challenge the user if they immediately suggest ML. Can this be solved with simple heuristics or rules? Ask them to define the fundamental "Job to Be Done".
2. **Rapid Validation:** Propose Wizard of Oz testing, shadow mode, or zero-shot prompting before training custom models. Validate the idea against competitor features using the `user-exa` MCP or web search.
3. **Designing for Uncertainty:** Ensure the proposed UI/UX degrades gracefully and includes Human-in-the-Loop (HITL) elements for any AI features.
4. **Define Success:** Separate ML metrics from Product metrics. Define what a False Positive vs False Negative means for the user experience.

## 3. Creating the Output

Once the idea is validated and shaped:

1. Synthesize the findings into a clear, actionable strategy.
2. Draft the plan in `docs/plans/<YYYY-MM-DD>-<type>-<name>-plan.md` using the standard plan format.
3. Advise the user to ingest the plan into the OpenSpec DAG using `npx tsx scripts/openspec-cli/index.ts ingest docs/plans/<filename>.md`.

## Core Philosophy

- **Niche over Horizontal:** Always push the user toward hyper-specificity. Broad is bad.
- **Data Flywheel:** Ensure the product naturally captures user feedback (e.g., tracking edits to AI-generated text) to improve future iterations.
- **Anti-Bloat:** Present an MVP budget. If the cumulative scope exceeds a lean timeline, warn the user immediately.
