import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import * as dotenv from "dotenv";
import { z } from "zod";
import { getAllSpecs, generateWithSelfHealing, hashString } from "./utils.js";
import { checkCollisions, promptUserConfirm } from "./collision.js";
import { checkCycles } from "./validate.js";
import { runEvalForFeature } from "./eval.js";
import { clearEvalState } from "./db.js";
import { CliOptions } from "./schema.js";
import { TerminalPresenter, isHeadless } from "./presenter.js";
import { FsIntent, FsExecutor } from "./fs-intents.js";
import { stageIntents, cleanupOldStaged } from "./stage.js";

dotenv.config({ quiet: true });

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

export async function proposePlan(planPath: string, options: CliOptions) {
  const presenter = new TerminalPresenter(
    options.nonInteractive || isHeadless(),
    options.json,
  );

  let planContent = "";

  if (planPath === "-" || options.stdin) {
    try {
      if (process.stdin.isTTY) {
        await presenter.fail(
          "Cannot read from stdin in interactive mode. Pipe a file.",
          "missing_stdin",
        );
        return;
      }
      planContent = fs.readFileSync(0, "utf-8");
    } catch (e) {
      await presenter.fail(
        "Failed to read from stdin. Ensure data is being piped correctly.",
        "stdin_error",
      );
      return;
    }
    if (!planContent) {
      await presenter.fail("No data received on stdin.", "empty_stdin");
      return;
    }
  } else {
    if (planPath.includes("docs/plans/")) {
      presenter.warn(
        "⚠️ Warning: docs/plans/ is deprecated. Redirecting to openspec/plans/...",
      );
      planPath = planPath.replace("docs/plans/", "openspec/plans/");
    }

    if (!fs.existsSync(planPath)) {
      await presenter.fail(
        `Plan file not found at ${planPath}`,
        "missing_file",
        `openspec propose openspec/plans/<valid-plan>.md`,
      );
      return;
    }
    planContent = fs.readFileSync(planPath, "utf-8");
  }

  if (!process.env.GEMINI_API_KEY) {
    await presenter.fail("GEMINI_API_KEY is not set.", "missing_env");
    return;
  }

  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({});

  presenter.log(
    planPath === "-" || options.stdin
      ? "Ingesting plan from stdin..."
      : `Ingesting plan from ${planPath}...`,
  );

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
    await presenter.fail(
      "Invalid featureName generated. Must be kebab-case.",
      "invalid_feature_name",
    );
    return;
  }

  if (options.clearState) {
    clearEvalState(featureName);
    presenter.log(`Cleared eval state for ${featureName}`);
  }

  const finalTargetDir = path.resolve(
    process.cwd(),
    "openspec",
    "changes",
    featureName,
  );
  if (fs.existsSync(finalTargetDir)) {
    if (!options.force) {
      if (options.nonInteractive || isHeadless()) {
        await presenter.fail(
          `Feature directory already exists at ${finalTargetDir}. Use --force to overwrite.`,
          "directory_exists",
          `openspec propose ${planPath === "-" || options.stdin ? "-" : planPath} --force`,
        );
        return;
      } else {
        const proceed = await promptUserConfirm(
          `⚠️ WARNING: The feature directory '${finalTargetDir}' already exists.\nAre you sure you want to completely overwrite it?`,
        );
        if (!proceed) {
          await presenter.fail("Aborted by user.", "aborted");
          return;
        }
      }
    } else {
      presenter.warn(
        `Overwriting existing directory ${finalTargetDir} due to --force flag.`,
      );
    }
  }

  const tmpDir = path.resolve(process.cwd(), ".openspec", ".tmp", featureName);
  const specsTmpDir = path.join(tmpDir, "specs", featureName);

  if (fs.existsSync(tmpDir)) {
    if (!options.force) {
      if (options.nonInteractive || isHeadless()) {
        await presenter.fail(
          `Temporary staging directory ${tmpDir} already exists and may contain unsaved work. Use --force to wipe it.`,
          "tmp_dir_exists",
          `openspec propose ${planPath === "-" || options.stdin ? "-" : planPath} --force`,
        );
        return;
      } else {
        const proceed = await promptUserConfirm(
          `⚠️ WARNING: The temporary staging directory '${tmpDir}' already exists.\nIt may contain unsaved work from a previous failed run or manual atomic staging.\nAre you sure you want to wipe it out and continue?`,
        );
        if (!proceed) {
          await presenter.fail("Aborted by user.", "aborted");
          return;
        }
      }
    }
    presenter.warn(`Wiping existing temporary directory ${tmpDir}...`);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  const yamlData: any = {
    schema: "spec-driven",
    status: "draft",
    learnings_extracted: false,
    created: new Date().toISOString().split("T")[0],
  };
  if (result.depends_on && result.depends_on.length > 0) {
    yamlData.depends_on = result.depends_on;
  }

  // Accumulate intents for scaffold creation
  // Cleanup old staged files
  cleanupOldStaged(options);

  const intents: FsIntent[] = [
    { kind: "mkdir", absolutePath: tmpDir },
    { kind: "mkdir", absolutePath: specsTmpDir },
    {
      kind: "createFile",
      absolutePath: path.join(tmpDir, ".openspec.yaml"),
      content: yaml.dump(yamlData),
    },
    {
      kind: "createFile",
      absolutePath: path.join(tmpDir, "proposal.md"),
      content: result.proposal,
    },
    {
      kind: "createFile",
      absolutePath: path.join(tmpDir, "design.md"),
      content: result.design,
    },
    {
      kind: "createFile",
      absolutePath: path.join(specsTmpDir, "spec.md"),
      content: result.spec,
    },
    {
      kind: "createFile",
      absolutePath: path.join(tmpDir, "tasks.md"),
      content: result.tasks,
    },
  ];

  const executor = new FsExecutor(options.dryRun, presenter);
  executor.execute(intents);

  if (options.dryRun) {
    // End early since the next steps depend on the files existing
    presenter.success(
      { featureName, path: `openspec/changes/${featureName}`, dryRun: true },
      `Dry-run complete. Scaffolding intents logged.`,
    );
    return;
  }

  // In-memory collision checks
  const existingSpecs = getAllSpecs();
  const tmpSpec = {
    id: featureName,
    dirPath: tmpDir,
    yamlPath: path.join(tmpDir, ".openspec.yaml"),
    data: yamlData,
  };
  existingSpecs.push(tmpSpec);

  // Validate DAG
  presenter.log("Validating DAG...");
  const isValid = checkCycles(existingSpecs);
  if (!isValid) {
    presenter.warn(
      `DAG validation failed (circular dependency detected). Temporary files left at ${tmpDir} for inspection.`,
    );
    await presenter.fail("DAG validation failed.", "dag_cycle");
    return;
  }

  // Collision detection
  presenter.log("Running collision detection...");
  const hasCollision = await checkCollisions(
    existingSpecs,
    true,
    featureName,
    options,
  );
  if (hasCollision === "abort") {
    presenter.warn(`Temporary files left at ${tmpDir} for inspection.`);
    await presenter.safeExit(1);
    return;
  }

  // ai-eval loop
  presenter.log("Running ai-eval on draft spec...");
  const evalPassed = await runEvalForFeature(tmpDir, featureName, options);

  if (!evalPassed) {
    await presenter.fail(
      `ai-eval failed or aborted. Temporary files left at ${tmpDir} for inspection.`,
      "eval_failed",
    );
    return;
  }

  // All checks passed! Move atomic
  const finalizeIntents: FsIntent[] = [
    {
      kind: "mkdir",
      absolutePath: path.resolve(process.cwd(), "openspec", "changes"),
    },
    ...(fs.existsSync(finalTargetDir)
      ? [{ kind: "deleteDir" as const, absolutePath: finalTargetDir }]
      : []),
    { kind: "renameDir", oldPath: tmpDir, newPath: finalTargetDir },
  ];

  // Archive plan (unless stdin)
  if (planPath !== "-" && !options.stdin) {
    if (planPath.includes(path.join("openspec", "plans"))) {
      const archiveDir = path.join(
        process.cwd(),
        "openspec",
        "archive",
        "plans",
      );
      finalizeIntents.push(
        { kind: "mkdir", absolutePath: archiveDir },
        {
          kind: "gitMove",
          oldPath: path.resolve(planPath),
          newPath: path.join(archiveDir, path.basename(planPath)),
        },
      );
    } else {
      presenter.warn(
        `Skipping archival of ${planPath} because it is not located in the openspec/plans directory.`,
      );
    }
  }

  if (options.stage && !options.force) {
    const staged = stageIntents(finalizeIntents, options, presenter);
    await presenter.success(
      { staged: true, token: staged.token, diffUris: staged.diffUris },
      `Changes staged.\nReview Diff URIs:\n${staged.diffUris.join("\n")}\nRun 'npm run openspec apply --token=${staged.token}' to commit.`,
    );
    return;
  }

  executor.execute(finalizeIntents);

  presenter.success(
    { success: true, featureName, path: `openspec/changes/${featureName}` },
    `Successfully scaffolded OpenSpec at openspec/changes/${featureName}`,
  );
}
