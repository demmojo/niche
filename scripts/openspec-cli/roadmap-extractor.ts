#!/usr/bin/env npx tsx

/**
 * Roadmap Extractor
 *
 * An ML-powered pre-commit script that analyzes modified `design.md` and `proposal.md`
 * spec files to automatically extract deferred features, "Non-Goals", and "Alternatives Considered".
 *
 * It transforms these technical compromises into visionary, user-facing "wow" features,
 * automatically appending them to `docs/ROADMAP.yaml` and re-compiling `docs/ROADMAP.md`
 * to guide the product roadmap and strategy.
 */

import { promises as fs } from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import * as dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ quiet: true });

type RoadmapFeature = {
  id: string;
  title: string;
  domain: string;
  description: string;
  strategic_value: string;
  status: string;
  source_file: string;
};

const featureSchema = z.object({
  id: z.string().describe("A unique kebab-case identifier for the feature"),
  title: z
    .string()
    .describe("A visionary, action-oriented title for the feature or refactor"),
  domain: z
    .string()
    .describe(
      "The primary domain of expertise: 'Product', 'Design', 'Architecture', or 'Machine Learning'",
    ),
  description: z
    .string()
    .describe(
      "Detailed strategic description of the future feature or refactor, explicitly tied to current (2026) user behavior, market data, or AI interaction paradigms.",
    ),
  strategic_value: z
    .string()
    .describe(
      "Why this matters to the business or market (e.g., 'Captures emerging 2026 prompt-driven dev trend', 'Reduces cognitive load by 10x', 'Creates a defensible AI data moat')",
    ),
});

const roadmapResponseSchema = z.object({
  features: z
    .array(featureSchema)
    .describe("List of strategically analyzed future roadmap items"),
});

/**
 *
 */
async function extractFeaturesFromDiff(stagedFiles: string[]): Promise<void> {
  const specFiles = stagedFiles.filter(
    (f) =>
      (f.includes("openspec/changes/") &&
        (f.endsWith("design.md") ||
          f.endsWith("proposal.md") ||
          f.endsWith("spec.md"))) ||
      f.includes("openspec/plans/"),
  );

  if (specFiles.length === 0) {
    console.log(
      "No relevant OpenSpec files modified. Skipping roadmap extraction.",
    );
    return;
  }

  if (!process.env.GEMINI_API_KEY) {
    console.warn("Skipping roadmap extraction: GEMINI_API_KEY is not set.");
    return;
  }

  const { GoogleGenAI } = await import("@google/genai");
  const { generateWithSelfHealing } = await import("./utils.js");
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  console.log(
    `Analyzing ${specFiles.length} spec file(s) for future roadmap features...`,
  );

  const roadmapYamlPath = path.resolve("docs/ROADMAP.yaml");
  const roadmapMdPath = path.resolve("docs/ROADMAP.md");

  try {
    let existingYamlContent = "";
    try {
      existingYamlContent = await fs.readFile(roadmapYamlPath, "utf-8");
    } catch {
      existingYamlContent = "features:\n";
    }

    const existingRoadmap = (yaml.load(existingYamlContent) as {
      features?: RoadmapFeature[];
    }) || { features: [] };
    if (!existingRoadmap.features) {
      existingRoadmap.features = [];
    }

    const newFeatures: RoadmapFeature[] = [];

    for (const file of specFiles) {
      const fileContent = await fs.readFile(file, "utf-8");

      // 1. Gather context from recent market trends/tools (via Exa, optional but simulated via prompt alignment)
      // We instruct the model to ground its recommendations in 2026 market context.
      const prompt = `Review the following feature specification file.

1. Actively apply your domains of expertise to identify missing opportunities, architectural limits, UX friction, and product expansion possibilities.
2. Ground your recommendations in actual 2026 product, user behavior, and market data trends. Ensure the "Wow" features you propose are not just technical debt disguised as features, but genuinely innovative market opportunities.
3. Read "Non-Goals", "Alternatives Considered", "Risks / Trade-offs", and the general design. Transform these technical compromises into 1-4 visionary "Wow" features, architectural evolutions, or ML enhancements.
4. For each item, specify its primary domain and clearly articulate the strategic value it brings to the user or business (e.g., how it aligns with modern AI user behavior or resolves widespread market friction).

Please strategically analyze and extract features from this specification:

<specification>
${fileContent}
</specification>

<example>
{
  "features": [
    {
      "id": "real-time-generative-feedback-copilot",
      "title": "Real-time Generative Feedback Co-pilot for External IDEs",
      "domain": "Design",
      "description": "An intelligent co-pilot, potentially implemented as a browser extension or a lightweight desktop agent, that integrates directly with external visual code generators or development environments (e.g., VS Code). As code is generated or edited, the co-pilot provides real-time, streaming feedback based on NicheAI's strategic constraints. It instantly highlights deviations, offers contextual suggestions, and can even auto-apply minor fixes, significantly reducing the iteration loop and proactively addressing AI context window limits.",
      "strategic_value": "Reduces cognitive load by 10x and accelerates the design-to-code cycle by providing instant, actionable feedback directly within the user's generative environment. Positions NicheAI as an indispensable, proactive co-pilot, not just a post-hoc validator, capturing the 2026 trend of always-on, intelligent AI assistance."
    }
  ]
}
</example>`;

      try {
        const result = await generateWithSelfHealing(
          ai,
          "gemini-3.1-pro-preview",
          prompt,
          roadmapResponseSchema,
          `You are an elite ensemble of tech strategists: an Expert Product Manager, a Visionary UX Designer, a Staff Architect, and a Lead ML Engineer. 
Your goal is not just to extract deferred tasks, but to strategically analyze the feature spec and propose high-leverage future evolutions for our living roadmap.`,
        );

        for (const feature of result.features) {
          newFeatures.push({
            ...feature,
            status: "Unverified",
            source_file: file,
          });
        }
      } catch (error) {
        console.warn(`Failed to process roadmap for ${file}`, error);
      }
    }

    if (newFeatures.length > 0) {
      // Check for duplicates by title or ID
      for (const nf of newFeatures) {
        if (
          !existingRoadmap.features.some(
            (f: RoadmapFeature) => f.id === nf.id || f.title === nf.title,
          )
        ) {
          existingRoadmap.features.push(nf);
          console.log(`✨ Extracted new wow feature: "${nf.title}"`);
        }
      }

      // Write YAML
      const newYamlContent = yaml.dump(existingRoadmap, { indent: 2 });
      await fs.writeFile(roadmapYamlPath, newYamlContent);

      // Re-compile MD
      let mdContent = `# Product Roadmap\n\nThis is a living document, automatically populated by the AI Product Roadmap Extractor. It transforms deferred features, non-goals, and technical compromises discovered in our OpenSpec \`design.md\`, \`proposal.md\`, \`spec.md\`, and \`openspec/plans/\` files into strategic product, design, architecture, and machine learning evolutions.\n\n## Future Potential & Strategic Evolutions\n\n*(Run \`git commit\` on any updated OpenSpec to automatically see extracted features here)*\n\n`;

      for (const f of existingRoadmap.features) {
        mdContent += `### ${f.title}\n\n`;
        mdContent += `- **Domain:** ${f.domain}\n`;
        mdContent += `- **Strategic Value:** ${f.strategic_value}\n`;
        mdContent += `- **Status:** ${f.status}\n`;
        mdContent += `- **Source:** \`${f.source_file}\`\n\n`;
        mdContent += `${f.description}\n\n`;
      }

      await fs.writeFile(roadmapMdPath, mdContent);

      console.log(
        "Roadmap extraction complete. Updated ROADMAP.yaml and ROADMAP.md.",
      );
    } else {
      console.log("No new deferred features or non-goals found.");
    }
  } catch (e) {
    console.error("Warning: Failed to process ROADMAP updates", e);
  }
}

// Entrypoint for lefthook
const args = process.argv.slice(2);
extractFeaturesFromDiff(args).catch((e) => {
  console.error("Fatal error in roadmap-extractor:", e);
  process.exit(1);
});
