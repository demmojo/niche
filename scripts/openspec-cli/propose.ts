import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import { GoogleGenAI } from "@google/genai";
import * as yaml from "js-yaml";
import * as dotenv from "dotenv";
import { z } from "zod";
import { getAllSpecs, generateWithSelfHealing, hashString } from "./utils.js";
import { checkCollisions } from "./collision.js";
import { checkCycles } from "./validate.js";
import { runEvalForFeature } from "./eval.js";
import { clearEvalState } from "./db.js";

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

export async function proposePlan(
  planPath: string,
  options: {
    nonInteractive?: boolean;
    onCollision?: string;
    autoFix?: boolean;
    clearState?: boolean;
  },
) {
  if (planPath.includes("docs/plans/")) {
    console.warn(
      "⚠️ Warning: docs/plans/ is deprecated. Redirecting to openspec/plans/...",
    );
    planPath = planPath.replace("docs/plans/", "openspec/plans/");
  }

  if (!fs.existsSync(planPath)) {
    const err = `Error: Plan file not found at ${planPath}`;
    if (options.nonInteractive)
      console.log(
        JSON.stringify({
          error: err,
          next_action: "Provide a valid plan file.",
        }),
      );
    else console.error(err);
    process.exit(1);
  }

  if (!process.env.GEMINI_API_KEY) {
    const err = "Error: GEMINI_API_KEY is not set.";
    if (options.nonInteractive)
      console.log(
        JSON.stringify({
          error: err,
          next_action: "Set GEMINI_API_KEY in .env",
        }),
      );
    else console.error(err);
    process.exit(1);
  }

  const planContent = fs.readFileSync(planPath, "utf-8");
  const ai = new GoogleGenAI({});

  if (!options.nonInteractive)
    console.log(`Ingesting plan from ${planPath}...`);

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

  let featureName = result.featureName;
  // Security: strict regex validation to prevent path traversal
  featureName = featureName.replace(/[^a-z0-9-]/g, "");
  if (!/^[a-z0-9-]+$/.test(featureName)) {
    const err = "Invalid featureName generated. Must be kebab-case.";
    if (options.nonInteractive)
      console.log(
        JSON.stringify({ error: err, next_action: "Check LLM output" }),
      );
    else console.error(err);
    process.exit(1);
  }

  if (options.clearState) {
    clearEvalState(featureName);
    if (!options.nonInteractive)
      console.log(`Cleared eval state for ${featureName}`);
  }

  const finalTargetDir = path.resolve(
    process.cwd(),
    "openspec",
    "changes",
    featureName,
  );
  if (fs.existsSync(finalTargetDir)) {
    const err = `Error: Feature directory already exists at ${finalTargetDir}`;
    if (options.nonInteractive)
      console.log(
        JSON.stringify({
          error: err,
          next_action:
            "Choose a different feature name or delete the existing directory.",
        }),
      );
    else console.error(err);
    process.exit(1);
  }

  const tmpDir = path.resolve(process.cwd(), ".openspec", ".tmp", featureName);
  const specsTmpDir = path.join(tmpDir, "specs", featureName);

  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // Scaffold directories in .tmp
  fs.mkdirSync(specsTmpDir, { recursive: true });

  // Write YAML
  const yamlData: any = {
    schema: "spec-driven",
    status: "draft",
    learnings_extracted: false,
    created: new Date().toISOString().split("T")[0],
  };
  if (result.depends_on && result.depends_on.length > 0) {
    yamlData.depends_on = result.depends_on;
  }

  fs.writeFileSync(path.join(tmpDir, ".openspec.yaml"), yaml.dump(yamlData));
  fs.writeFileSync(path.join(tmpDir, "proposal.md"), result.proposal);
  fs.writeFileSync(path.join(tmpDir, "design.md"), result.design);
  fs.writeFileSync(path.join(specsTmpDir, "spec.md"), result.spec);
  fs.writeFileSync(path.join(tmpDir, "tasks.md"), result.tasks);

  // In-memory collision checks
  // We can load existing specs and add this tmp one
  const existingSpecs = getAllSpecs();
  const tmpSpec = {
    id: featureName,
    dirPath: tmpDir,
    yamlPath: path.join(tmpDir, ".openspec.yaml"),
    data: yamlData,
  };
  existingSpecs.push(tmpSpec);

  // Validate DAG
  if (!options.nonInteractive) console.log("Validating DAG...");
  const isValid = checkCycles(existingSpecs);
  if (!isValid) {
    const err =
      "DAG validation failed (circular dependency detected). Rolling back temporary files.";
    fs.rmSync(tmpDir, { recursive: true, force: true });
    if (options.nonInteractive)
      console.log(
        JSON.stringify({ error: err, next_action: "Fix dependencies in plan" }),
      );
    else console.error(err);
    process.exit(1);
  }

  // Collision detection
  if (!options.nonInteractive) console.log("Running collision detection...");
  // ... we need to check collisions and handle interactive resolution
  const hasCollision = await checkCollisions(
    existingSpecs,
    true,
    featureName,
    options,
  );
  if (hasCollision === "abort") {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    process.exit(1);
  }

  // ai-eval loop
  if (!options.nonInteractive) console.log("Running ai-eval on draft spec...");
  const evalPassed = await runEvalForFeature(tmpDir, featureName, options);

  if (!evalPassed) {
    const err = "ai-eval failed or aborted. Rolling back temporary files.";
    fs.rmSync(tmpDir, { recursive: true, force: true });
    if (options.nonInteractive)
      console.log(
        JSON.stringify({
          error: err,
          next_action: "Review ai-eval feedback, or use --auto-fix=true",
        }),
      );
    else console.error(err);
    process.exit(1);
  }

  // All checks passed! Move atomic
  fs.mkdirSync(path.resolve(process.cwd(), "openspec", "changes"), {
    recursive: true,
  });
  fs.renameSync(tmpDir, finalTargetDir);

  // Archive plan
  const archiveDir = path.join(process.cwd(), "openspec", "archive", "plans");
  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
  }
  const archivePath = path.join(archiveDir, path.basename(planPath));
  fs.renameSync(planPath, archivePath);

  if (!options.nonInteractive) {
    console.log(
      `✅ Successfully scaffolded OpenSpec at openspec/changes/${featureName}`,
    );
    console.log(`📦 Archived original plan to ${archivePath}`);
  } else {
    console.log(
      JSON.stringify({
        success: true,
        featureName,
        path: `openspec/changes/${featureName}`,
      }),
    );
  }
}
