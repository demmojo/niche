# Proposal: NicheAI’s Opinionated UI Pipeline

## Why
As the AI-native development ecosystem evolves in 2026, the primary challenge for frontend engineering is avoiding "regression to the mean"—the homogenization of design often referred to as "AI Slop." We need to formalize NicheAI’s opinionated workflow to guide contributors and preserve design integrity.

## What Changes
We are introducing a formalized documentation suite in `README.md` and `AGENTS.md`, along with a robust local prompt system in `.cursor/prompts/ui-scaffold.md`. This pipeline establishes the "Anti-Slop MLP Stack."

## Capabilities
- **Core Local Workflow**: Guides local IDE agents (Cursor/Windsurf) using centralized constraints, reducing reliance on premium "Walled Garden" external tools.
- **Colocated Components Standard**: Instructs LLMs to combine UI and localized state to avoid hallucination, while maintaining maintainability via Pure Functional Extraction.
- **The One-Way Trip Rule**: Defines a strict handoff where components, once wired with logic (Firebase/Zustand), are maintained purely locally, preventing overwrites.

## Impact
Prevents "Toolchain Fatigue" by centering development in local IDEs. Drastically reduces "Day 2 Maintenance" issues caused by conflicting logic generators, and ensures our products avoid generic SaaS aesthetics through deliberate Visual Theses.