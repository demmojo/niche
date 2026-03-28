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
import { execSync } from "child_process";
import { GoogleGenAI } from "@google/genai";
import * as yaml from "js-yaml";
import * as dotenv from "dotenv";

dotenv.config();

type RoadmapFeature = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  source_file: string;
};

async function extractFeaturesFromDiff(stagedFiles: string[]): Promise<void> {
  const specFiles = stagedFiles.filter(
    (f) =>
      f.includes("openspec/changes/") &&
      (f.endsWith("design.md") || f.endsWith("proposal.md")),
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

  const ai = new GoogleGenAI({});
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

      const prompt = `You are an expert Product Manager and AI Strategist. 
Review the following feature specification file.

1. Identify any deferred features, "Non-Goals", "Alternatives Considered", or "Risks / Trade-offs" that were skipped for complexity or time.
2. Elevate these technical compromises into 1-3 visionary, user-facing "Wow" features for our future roadmap.
3. Transform boring technical debt into exciting product capabilities.

Please extract features from this specification:
${fileContent}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              features: {
                type: "array",
                description: "List of extracted visionary features",
                items: {
                  type: "object",
                  properties: {
                    id: {
                      type: "string",
                      description:
                        "A unique kebab-case identifier for the feature",
                    },
                    title: {
                      type: "string",
                      description:
                        "A visionary, user-facing title for the feature",
                    },
                    description: {
                      type: "string",
                      description:
                        "A detailed description of the feature, framing the technical compromise as a magical product capability",
                    },
                    category: {
                      type: "string",
                      description:
                        "Category, e.g., 'Performance', 'UX Wow', 'Architecture'",
                    },
                  },
                  required: ["id", "title", "description", "category"],
                },
              },
            },
            required: ["features"],
          },
        },
      });

      const content = response.text;
      if (content) {
        const result = JSON.parse(content);
        for (const feature of result.features) {
          newFeatures.push({
            ...feature,
            status: "Unverified",
            source_file: file,
          });
        }
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
      let mdContent = `# Product Roadmap\n\nThis is a living document, automatically populated by the AI Product Roadmap Extractor based on deferred features, non-goals, and technical compromises discovered in our OpenSpec \`design.md\` and \`proposal.md\` files during the git lifecycle.\n\n## Future Potential & Wow Features\n\n*(Run \`git commit\` on any updated OpenSpec to automatically see extracted features here)*\n\n`;

      for (const f of existingRoadmap.features) {
        mdContent += `### ${f.title}\n\n`;
        mdContent += `- **Category:** ${f.category}\n`;
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
