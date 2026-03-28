import { MyProductData } from "../components/MyProduct";

export interface PromptConfig {
  scope: "app" | "component";
  techStack: "react-tailwind" | "vue" | "svelte";
  contextLevel: "strict" | "creative";
  enforceBrand: boolean;
}

/**
 *
 */
export const hexToHsl = (hex: string): string => {
  // Convert hex to RGB first
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt("0x" + hex[1] + hex[1]);
    g = parseInt("0x" + hex[2] + hex[2]);
    b = parseInt("0x" + hex[3] + hex[3]);
  } else if (hex.length === 7) {
    r = parseInt("0x" + hex[1] + hex[2]);
    g = parseInt("0x" + hex[3] + hex[4]);
    b = parseInt("0x" + hex[5] + hex[6]);
  }
  // Then to HSL
  r /= 255;
  g /= 255;
  b /= 255;
  const cmin = Math.min(r, g, b),
        cmax = Math.max(r, g, b),
        delta = cmax - cmin;
  let h = 0, s = 0, l = 0;

  if (delta === 0) h = 0;
  else if (cmax === r) h = ((g - b) / delta) % 6;
  else if (cmax === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);
  if (h < 0) h += 360;
  l = (cmax + cmin) / 2;
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  return `${h} ${s}% ${l}%`;
};

// Function that parses project identity context
/**
 *
 */
export const formatBrandIdentityContext = (
  identity: any = null
): string => {
  const visualIdentity = identity?.selected_identity?.visual_identity;
  const positioning = identity?.selected_identity?.positioning;
  
  if (!visualIdentity || !positioning) return "";

  // Convert Hex to HSL for reliable shadcn/ui injection
  const primaryHsl = hexToHsl(visualIdentity.primary_color);
  
  return `
# [STYLE] - Voice & Personality
**Brand Personality**: ${positioning.personality}
**Brand Voice**: ${Array.isArray(positioning.tone) ? positioning.tone.join(", ") : positioning.tone}
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

/**
 *
 */
export const generateSystemPrompt = (
  productData: MyProductData,
  config: PromptConfig,
  brandIdentity: any = null
): string => {
  const stackDirectives =
    config.techStack === "react-tailwind"
      ? "Use React functional components and Tailwind CSS utility classes."
      : config.techStack === "vue"
      ? "Use Vue 3 Composition API with `<script setup>` syntax."
      : "Use Svelte 5 runes syntax.";

  const scopeDirective =
    config.scope === "app"
      ? "You are generating a complete layout for the application including navigation and main content area."
      : "You are generating a single, focused, isolated component. Do not include global layout wrappers.";

  const contextLevelDirective =
    config.contextLevel === "strict"
      ? "Adhere strictly to the constraints provided below. Do not add superfluous features."
      : "Use the constraints below as a baseline, but feel free to suggest creative UI flourishes and animations.";

  const featuresList = productData.features.map((f) => `- ${f.name}: ${f.description}`).join("\n");

  const brandContext = config.enforceBrand ? formatBrandIdentityContext(brandIdentity) : "";

  return `
# [CONTEXT]
You are an expert Frontend Engineer and UX Designer.
${scopeDirective}
${contextLevelDirective}

**Product Name:** ${productData.name}
**Description:** ${productData.description}

# [OBJECTIVE]
Generate production-ready code based on the provided product constraints and visual identity.

# [CONSTRAINTS]
${stackDirectives}

**Product Features to Implement:**
${featuresList || "Implement a generic dashboard landing page."}

${brandContext}

# [RESPONSE]
Provide the code entirely within markdown code blocks. Ensure the code is complete, functional, and requires no external proprietary setup.
`;
};
