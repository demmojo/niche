# Brainstorm: "Living Brand" MVP Integration

**Date:** 2026-03-28
**Participants:** User, AI Product Strategist
**Status:** Brainstorm Complete
**Related To:** `brand-positioning-wizard`, `MyProduct.tsx`, `rapid-pdlc-prompt-exporter`

## 1. What We're Building

Currently, the `BrandWizardFeature` extracts a differentiated `ProjectBrandIdentity` and saves it to Firestore, but the rest of the application (specifically the `MyProduct` dashboard and strategy generators) ignores it.

We are integrating the `ProjectBrandIdentity` into the core product loop to create a "Living Brand" experience. This has two main goals:

1. **The "Aha!" Moment (Visual):** Use the extracted primary color to subtly theme the NicheAI UI for that specific project, making the founder feel their niche is distinct and "real."
2. **Strategic Coherence (Data Flywheel):** Pass the brand's tone and personality into NicheAI's internal "AI Suggest" prompt, ensuring that new feature ideas and strategic steps match the brand vibe (e.g., suggesting gamification for a "Playful" brand).

## 2. Why This Approach?

The user requested four different integration ideas (Theming, Strategic Guardrails, Dashboard Display, Asset Export).

Following the **Anti-Bloat** principle, we rejected building all four at once (which would require a massive theming engine and rigid guardrail architecture). Instead, the "Living Brand" MVP focuses on the highest-impact, lowest-cost items:

- CSS variable injection is cheap but highly emotional.
- Prompt injection for "AI Suggest" requires no new UI, just passing data to the LLM.
- A simple "Copy CSS" button acts as a lightweight asset export without needing to generate full Tailwind configs or PDFs.

This perfectly balances the "Niche over Horizontal" vision with lean execution.

## 3. Key Decisions

- **Visual Theming:** We will fetch the `ProjectBrandIdentity` in `MyProduct.tsx` and dynamically inject a `--brand-primary` CSS variable onto a wrapper div. We will use this variable for subtle accents (like the "AI Suggest" button or primary borders) rather than completely overriding NicheAI's dark mode, preventing accessibility/contrast issues if the user picks a neon color.
- **AI Suggest Integration:** We will modify the system prompt inside `handleSuggestStrategicItems` and `handleAddFeature` (when using AI) to include: _"Your suggestions MUST align with this brand's personality: [Tone] / [Personality]."_
- **Dashboard Display:** We will add a small, collapsible "Brand Identity" widget to the top right of the `MyProduct` dashboard. It will show color swatches, typography names, and the core tone.
- **Asset Export:** Inside the widget, a single "Copy CSS Variables" button will format the colors and fonts into standard CSS custom properties for easy handoff.
- **Bidirectional Data Flywheel (ML Best Practice):** Leveraging Continual Learning patterns (Memory-Driven Iterative Improvement), the generated code artifacts will act as a bidirectional signal. When a user generates code externally (e.g., v0.dev) and pastes it back into NicheAI's Artifact Reviewer, we will parse the CSS/Tailwind variables. If the generated code includes _new_ visual decisions (e.g., a complementary secondary color or specific border radius) that the user accepts, we will extract these and update the `ProjectBrandIdentity` in Firestore. This prevents "catastrophic forgetting" of design decisions across sessions and ensures the brand identity evolves organically based on actual execution.

## 4. Open Questions

None at this time. All questions have been resolved during the collaborative dialogue phase.

## 5. Resolved Questions

- **Where will the brand be displayed?** In a new `BrandIdentityWidget` on the `MyProduct.tsx` page.
- **How will theming work safely?** By scoping a CSS variable to the `MyProduct` container and only using it for accents, not text or backgrounds that require high contrast ratios.
- **Does this affect the prompt exporter?** Yes! Based on ML best practices for Continual Learning (e.g., memory-driven iterative improvement), the generated code artifacts will act as a bidirectional signal. When a user pastes generated code back into NicheAI's Artifact Reviewer, we will extract any new brand decisions (e.g., new secondary colors or spacing variables) and update the `ProjectBrandIdentity` in Firestore. This creates a true Data Flywheel where the AI learns from the user's execution.
