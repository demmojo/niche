---
title: Inject Brand Identity into Prompt Exporter
type: feat
status: active
date: 2026-03-28
---

# Inject Brand Identity into Prompt Exporter

## Overview

We recently built the **Brand Positioning Wizard**, which extracts and synthesizes a `ProjectBrandIdentity` (visual identity, hex colors, typography, tone, and personality) from competitor data to find the market whitespace.

Currently, the `rapid-pdlc-prompt-exporter` (Strategy-to-Code) feature only exports Jobs-To-Be-Done (JTBDs) and Competitor Flaws. To ensure that external AI code generators (like v0.dev, Bolt.new, or Claude) generate UIs that perfectly match the user's differentiated brand, we must inject the `ProjectBrandIdentity` directly into the exported prompt.

## Problem Statement / Motivation

If a founder uses NicheAI to discover a "Blue Ocean" brand identity (e.g., Playful Tone, `#CCFF00` Neon accents, `Clash Display` fonts) but the Prompt Exporter doesn't include this data, v0.dev will generate a generic, corporate-looking UI (the exact "Tarpit" we are trying to avoid). We need the exported prompt to enforce the brand guidelines aggressively.

## Proposed Solution & Technical Approach

### 1. Update `promptAssembler.ts` (Client-Side)

**Architectural Simplification: Pure Function Interpolation**
Instead of over-engineering a "Plugin" architecture, `promptAssembler.ts` will use a simple, type-safe pure function to conditionally format and append the Brand Identity to the CO-STAR structure.

```typescript
export const formatBrandIdentityContext = (
  identity?: ProjectBrandIdentity | null,
): string => {
  const visualIdentity = identity?.selected_identity?.visual_identity;
  const positioning = identity?.selected_identity?.positioning;

  if (!visualIdentity || !positioning) return "";

  // Convert Hex to HSL for reliable shadcn/ui injection
  const primaryHsl = hexToHsl(visualIdentity.primary_color);

  return `
# [STYLE] - Voice & Personality
**Brand Personality**: ${positioning.personality}
**Brand Voice**: ${positioning.tone.join(", ")}
**Copywriting Directive**: Your generated UI must not contain generic corporate boilerplate. Every piece of microcopy (buttons, empty states, tooltips, loading text) must reflect this exact personality.

# [CONSTRAINTS] - Visual Identity & Theming
<design_system_constraints>
  <typography>
    <heading_font>${visualIdentity.typography_pair}</heading_font>
  </typography>
  <color_palette>
    <primary_hsl>${primaryHsl}</primary_hsl>
  </color_palette>

  <critical_implementation_rules>
    1. THEME OVERRIDE MANDATE: If using shadcn/ui, you MUST overwrite the \`:root\` and \`.dark\` HSL variables in \`globals.css\` using the exact HSL values provided above (e.g. \`--primary: ${primaryHsl};\`).
    2. NO INLINE ARBITRARY VALUES: Do NOT scatter arbitrary Tailwind values in the JSX markup.
    3. FONT IMPORT: You MUST import the specified fonts from Google Fonts in the global CSS.
  </critical_implementation_rules>
</design_system_constraints>`;
};
```

### 2. Update the Artifact Reviewer (Semantic Validation)

Validating CSS exact string matches via Regex (e.g., searching for `--primary: 72 100% 50%`) is brittle and leads to constant maintenance due to LLM formatting quirks (spaces, decimals, commas). Visual compliance (colors/fonts) will be validated instantly by the user (Human-in-the-Loop) looking at the generated UI.

However, evaluating if the microcopy aligns with the Brand Tone is critical. We will use the AI Critic to perform Semantic Validation safely.

```typescript
// Type-safe Zod Schema for LLM Extraction
const ArtifactSemanticSchema = z.object({
  isToneCompliant: z.boolean(),
  feedback: z.string(),
});

export const validateArtifactTone = async (
  code: string,
  brand: ProjectBrandIdentity,
) => {
  const positioning = brand.selected_identity?.positioning;
  if (!positioning) throw new Error("Incomplete brand identity.");

  // Mitigate prompt injection by wrapping code in XML bounds
  const prompt = `Evaluate if the microcopy matches the tone: ${positioning.tone.join(", ")}.
<code_to_review>
${code}
</code_to_review>`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: geminiSchemaEquiv,
    },
  });

  // Explicitly parse stringified JSON for runtime safety
  return ArtifactSemanticSchema.parse(JSON.parse(response.text));
};
```

### 3. Update `StrategyToCodeWizard.tsx` UI

Add a toggle in Step 1 (Configure) of the wizard:

- `[x] Enforce Brand Identity (Colors, Fonts, Tone)` - Enabled by default if a `ProjectBrandIdentity` exists for the project.

## Acceptance Criteria

- [ ] `promptAssembler.ts` uses a pure function to securely format and inject `ProjectBrandIdentity`.
- [ ] Client-side utility added to convert Hex to HSL for `shadcn/ui` variable injection.
- [ ] The generated prompt includes XML strict boundaries and explicit Tailwind/CSS configuration instructions for the visual assets.
- [ ] The `ArtifactReviewer` uses explicit Zod parsing for LLM tone evaluation and wraps pasted code in `<code_to_review>` XML tags to prevent injection attacks.

## Dependencies & Risks

- **Risk:** v0.dev or Bolt might still ignore instructions and fall back to generic components.
- **Mitigation:** The explicit `THEME OVERRIDE MANDATE` and `NO INLINE ARBITRARY VALUES` XML rules are designed specifically to break this habit in Claude-based models.

## References

- Previous Spec: `openspec/changes/rapid-pdlc-prompt-exporter`
- Related Feature: `brand-positioning-wizard`
