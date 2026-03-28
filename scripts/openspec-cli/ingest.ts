import * as fs from "fs";
import * as path from "path";
import { GoogleGenAI } from "@google/genai";
import * as yaml from "js-yaml";
import * as dotenv from "dotenv";
import { z } from "zod";
import { getAllSpecs, generateWithSelfHealing } from "./utils.js";
import { checkCollisions } from "./collision.js";

dotenv.config();

const IngestSchema = z.object({
  featureName: z
    .string()
    .describe("Kebab-case short name for the feature directory"),
  proposal: z
    .string()
    .describe(
      "Markdown content for proposal.md (Why, What Changes, Capabilities, Impact)",
    ),
  design: z
    .string()
    .describe(
      "Markdown content for design.md (Context, Goals/Non-Goals, Decisions, Risks/Trade-offs, Future Potential)",
    ),
  spec: z
    .string()
    .describe(
      "Markdown content for spec.md (Detailed features, scenarios with WHEN/THEN)",
    ),
  tasks: z
    .string()
    .describe(
      "Markdown content for tasks.md (Actionable checkbox lists by phase)",
    ),
  depends_on: z
    .array(z.string())
    .optional()
    .describe("List of feature-names this depends on"),
});

export async function ingestPlan(planPath: string) {
  if (!fs.existsSync(planPath)) {
    console.error(`Error: Plan file not found at ${planPath}`);
    throw new Error(`Error: Plan file not found at ${planPath}`);
  }

  if (!process.env.GEMINI_API_KEY) {
    console.error("Error: GEMINI_API_KEY is not set.");
    throw new Error("Error: GEMINI_API_KEY is not set.");
  }

  const planContent = fs.readFileSync(planPath, "utf-8");
  const ai = new GoogleGenAI({});

  console.log(`Ingesting plan from ${planPath}...`);
  console.log("Analyzing and transforming to OpenSpec artifacts...");

  try {
    const systemInstruction = `You are an elite Staff Software Engineer. Your task is to extract a brainstorm/plan markdown document and transform it into the strict 5-file OpenSpec format.

          Output requirements:
          1. featureName: A short, kebab-case directory name for this feature.
          2. proposal: Markdown content for proposal.md (Why, What Changes, Capabilities, Impact).
          3. design: Markdown content for design.md (Context, Goals/Non-Goals, Decisions, Risks/Trade-offs, Future Potential).
          4. spec: Markdown content for spec.md (Detailed features, scenarios with WHEN/THEN).
          5. tasks: Markdown content for tasks.md (Actionable checkbox lists by phase).
          6. depends_on: An array of feature names this spec depends on, if any can be inferred.`;

    const result = await generateWithSelfHealing(
      ai,
      "gemini-3.1-pro-preview",
      `Please transform this plan into OpenSpec artifacts:\n\n${planContent}`,
      IngestSchema,
      systemInstruction,
    );

    const featureName = result.featureName;
    const targetDir = path.join(
      process.cwd(),
      "openspec",
      "changes",
      featureName,
    );
    const specsDir = path.join(targetDir, "specs", featureName);

    if (fs.existsSync(targetDir)) {
      console.error(`Error: Feature directory already exists at ${targetDir}`);
      process.exit(1);
    }

    // Scaffold directories
    fs.mkdirSync(specsDir, { recursive: true });

    // Write YAML
    const yamlData: any = {
      schema: "spec-driven",
      status: "draft",
      created: new Date().toISOString().split("T")[0],
    };
    if (result.depends_on && result.depends_on.length > 0) {
      yamlData.depends_on = result.depends_on;
    }

    fs.writeFileSync(
      path.join(targetDir, ".openspec.yaml"),
      yaml.dump(yamlData),
    );
    fs.writeFileSync(path.join(targetDir, "proposal.md"), result.proposal);
    fs.writeFileSync(path.join(targetDir, "design.md"), result.design);
    fs.writeFileSync(path.join(specsDir, "spec.md"), result.spec);
    fs.writeFileSync(path.join(targetDir, "tasks.md"), result.tasks);

    console.log(
      `✅ Successfully scaffolded OpenSpec at openspec/changes/${featureName}`,
    );

    // Run collision detection
    console.log("Running collision detection...");
    const updatedSpecs = getAllSpecs();
    await checkCollisions(updatedSpecs);

    // Archive original plan
    const archiveDir = path.join(process.cwd(), "docs", "archive", "plans");
    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
    }
    const archivePath = path.join(archiveDir, path.basename(planPath));
    fs.renameSync(planPath, archivePath);
    console.log(`📦 Archived original plan to ${archivePath}`);
  } catch (error) {
    console.error(`Error ingesting plan:`, error);
    process.exit(1);
  }
}
