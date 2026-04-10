import * as fs from "fs";
import * as path from "path";
import { ParsedSpec } from "./utils.js";
import * as dotenv from "dotenv";
import { CliOptions } from "./schema.js";
import { TerminalPresenter, isHeadless } from "./presenter.js";

dotenv.config({ quiet: true });

/**
 *
 */
import { hashString } from "./utils.js";

function getSpecContent(dirPath: string, featureName?: string): string {
  try {
    const proposal = fs.readFileSync(
      path.join(dirPath, "proposal.md"),
      "utf-8",
    );
    const design = fs.readFileSync(path.join(dirPath, "design.md"), "utf-8");
    const tasks = fs.readFileSync(path.join(dirPath, "tasks.md"), "utf-8");

    let specMd = "";
    if (featureName) {
      const specPath = path.join(dirPath, "specs", featureName, "spec.md");
      if (fs.existsSync(specPath)) {
        specMd = fs.readFileSync(specPath, "utf-8");
      }
    }

    return `Proposal:\n${proposal}\n\nDesign:\n${design}\n\nSpec:\n${specMd}\n\nTasks:\n${tasks}`;
  } catch (err) {
    return "Missing one or more spec markdown files.";
  }
}

export function getSpecContentHash(
  dirPath: string,
  featureName: string,
): string {
  const content = getSpecContent(dirPath, featureName);
  // Exclude tasks.md changes from hash to prevent blocking developers just for checking off tasks
  // Actually we can just hash proposal, design, and spec.md
  try {
    const proposal = fs.readFileSync(
      path.join(dirPath, "proposal.md"),
      "utf-8",
    );
    const design = fs.readFileSync(path.join(dirPath, "design.md"), "utf-8");
    let specMd = "";
    const specPath = path.join(dirPath, "specs", featureName, "spec.md");
    if (fs.existsSync(specPath)) specMd = fs.readFileSync(specPath, "utf-8");

    return hashString(
      `Proposal:\n${proposal}\n\nDesign:\n${design}\n\nSpec:\n${specMd}`,
    );
  } catch {
    return "";
  }
}

/**
 *
 */
export async function runEvalForFeature(
  dirPath: string,
  featureName: string,
  options: CliOptions,
): Promise<boolean> {
  const presenter = new TerminalPresenter(
    options.nonInteractive || isHeadless(),
    options.json,
  );

  if (!process.env.GEMINI_API_KEY) {
    presenter.warn("Skipping eval: GEMINI_API_KEY is not set.");
    return false; // Actually, if we skip eval we can't start. So we should fail.
  }

  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const { generateWithSelfHealing, hashString } = await import("./utils.js");
  const { saveEval, getLastFailedEval, getLastSuccessfulEval } =
    await import("./db.js");
  const { z } = await import("zod");
  const { promptUserConfirm } = await import("./collision.js");

  const evalZodSchema = z.object({
    implementationAmbiguity: z.object({
      score: z.number().min(1).max(5),
      feedback: z.string(),
    }),
    architectureConstraints: z.object({
      score: z.number().min(1).max(5),
      feedback: z.string(),
    }),
    backwardCompatibility: z.object({
      score: z.number().min(1).max(5),
      feedback: z.string(),
    }),
    pass: z.boolean(),
    overallFeedback: z.string(),
  });

  const fixZodSchema = z.object({
    proposal: z.string(),
    design: z.string(),
    spec: z.string(),
    tasks: z.string(),
  });

  const systemInstruction = `You are an elite Staff Software Engineer reviewing a product specification.
To pass, all dimensions must score at least 3 out of 5.`;

  const fixSystemInstruction = `You are an elite Staff Software Engineer fixing a product specification.
You must rewrite the files to address the evaluator's feedback, improving clarity and architecture.
Do not change the intent or core feature, just improve the specification quality.`;

  let maxRetries = 2;
  let attempt = 0;

  while (attempt <= maxRetries) {
    attempt++;
    const content = getSpecContent(dirPath, featureName);
    const contentHash = getSpecContentHash(dirPath, featureName);
    const lastFailedFeedback = getLastFailedEval(featureName);

    let prompt = `Please evaluate the following specification:\n\n<specification>\n${content}\n</specification>`;
    if (lastFailedFeedback) {
      prompt += `\n\n<previous_feedback>\n${JSON.stringify(lastFailedFeedback, null, 2)}\n</previous_feedback>\n\nNOTE: This spec previously failed. Ensure issues have been addressed.`;
    }

    const evalResult = await generateWithSelfHealing(
      ai,
      "gemini-3.1-pro-preview",
      prompt,
      evalZodSchema,
      systemInstruction,
    );

    presenter.log(
      `- Ambiguity Score: ${evalResult.implementationAmbiguity.score}/5`,
    );
    presenter.log(
      `- Architecture Score: ${evalResult.architectureConstraints.score}/5`,
    );
    presenter.log(
      `- Compatibility Score: ${evalResult.backwardCompatibility.score}/5`,
    );
    presenter.log(`\nFeedback: ${evalResult.overallFeedback}`);

    saveEval(
      Date.now().toString(),
      featureName,
      contentHash,
      evalResult.pass,
      evalResult,
    );

    if (evalResult.pass) {
      presenter.log(`✅ ${featureName} PASSED the semantic pass.`);
      return true;
    }

    presenter.warn(`❌ ${featureName} FAILED the semantic pass.`);

    if (attempt > maxRetries) {
      presenter.warn("Max retries reached for ai-eval auto-fix.");
      return false;
    }

    // Handle auto-fix loop
    let doAutoFix = false;
    const isHeadlessEnv = options.nonInteractive || isHeadless();
    if (isHeadlessEnv) {
      doAutoFix = !!options.autoFix;
      if (!doAutoFix) {
        presenter.fail(
          "AI Eval failed.",
          "ai_eval_failed",
          `openspec start ${featureName} --auto-fix`,
        );
        return false;
      }
    } else {
      doAutoFix = await promptUserConfirm(
        "Would you like me to rewrite the spec to address these issues?",
      );
    }

    if (doAutoFix) {
      presenter.log(`Attempting auto-fix ${attempt}/${maxRetries}...`);
      const fixPrompt = `The evaluator provided the following feedback:\n\n${evalResult.overallFeedback}\n\nPlease rewrite the specification files to address this feedback.\n\nOriginal Specification:\n${content}`;
      const fixResult = await generateWithSelfHealing(
        ai,
        "gemini-3.1-pro-preview",
        fixPrompt,
        fixZodSchema,
        fixSystemInstruction,
      );

      const { stageIntents } = await import("./stage.js");
      const { FsExecutor } = await import("./fs-intents.js");
      type FsIntent = import("./fs-intents.js").FsIntent;

      const intents: FsIntent[] = [
        {
          kind: "createFile",
          absolutePath: path.join(dirPath, "proposal.md"),
          content: fixResult.proposal,
        },
        {
          kind: "createFile",
          absolutePath: path.join(dirPath, "design.md"),
          content: fixResult.design,
        },
        {
          kind: "createFile",
          absolutePath: path.join(dirPath, "tasks.md"),
          content: fixResult.tasks,
        },
      ];

      const specsDir = path.join(dirPath, "specs", featureName);
      intents.push({ kind: "mkdir", absolutePath: specsDir });
      intents.push({
        kind: "createFile",
        absolutePath: path.join(specsDir, "spec.md"),
        content: fixResult.spec,
      });

      if (options.stage && !options.force) {
        const staged = stageIntents(intents, options, presenter);
        await presenter.success(
          { staged: true, token: staged.token, diffUris: staged.diffUris },
          `Auto-fix changes staged.\nReview Diff URIs:\n${staged.diffUris.join("\n")}\nRun 'npm run openspec apply --token=${staged.token}' to commit.`,
        );
        return false; // Stop eval loop until applied
      }

      const finalExecutor = new FsExecutor(options.dryRun, presenter);
      finalExecutor.execute(intents);

      presenter.log("Files rewritten. Re-running evaluation...");
    } else {
      return false;
    }
  }

  return false;
}

export async function runEval(specs: ParsedSpec[], options: CliOptions) {
  const presenter = new TerminalPresenter(
    options.nonInteractive || isHeadless(),
    options.json,
  );

  if (!process.env.GEMINI_API_KEY) {
    presenter.warn("Skipping eval: GEMINI_API_KEY is not set.");
    return;
  }

  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const { generateWithSelfHealing, hashString } = await import("./utils.js");
  const { saveEval, getLastFailedEval, getLastSuccessfulEval } =
    await import("./db.js");
  const { z } = await import("zod");

  const evalZodSchema = z.object({
    implementationAmbiguity: z
      .object({
        score: z.number().min(1).max(5),
        feedback: z.string(),
      })
      .describe("Score out of 5 and feedback for implementation ambiguity"),
    architectureConstraints: z
      .object({
        score: z.number().min(1).max(5),
        feedback: z.string(),
      })
      .describe("Score out of 5 and feedback for architecture constraints"),
    backwardCompatibility: z
      .object({
        score: z.number().min(1).max(5),
        feedback: z.string(),
      })
      .describe("Score out of 5 and feedback for backward compatibility"),
    pass: z.boolean(),
    overallFeedback: z.string(),
  });

  presenter.log(
    "Running Semantic Pass (LLM-as-a-Judge Eval) on recent specs...",
  );

  // Let's test the most recently modified or draft specs
  const draftSpecs = specs.filter(
    (s) => s.data.status === "draft" || s.data.status === "proposed",
  );

  if (draftSpecs.length === 0) {
    presenter.log("No specs in 'draft' or 'proposed' state to evaluate.");
    if (options.json)
      presenter.success({ evaluated: 0 }, "No specs to evaluate");
    return;
  }

  let failedSpecs = 0;
  let skippedSpecs = 0;
  let passedSpecs = 0;

  for (const spec of draftSpecs) {
    try {
      const content = getSpecContent(spec.dirPath, spec.id);
      const contentHash = getSpecContentHash(spec.dirPath, spec.id);
      const lastSuccess = getLastSuccessfulEval(spec.id);

      // Idempotency: Skip if hash matches last successful eval
      if (lastSuccess && lastSuccess.content_hash === contentHash) {
        presenter.log(
          `\nSkipping ${spec.id} - unchanged since last successful eval.`,
        );
        skippedSpecs++;
        continue;
      }

      presenter.log(`\nEvaluating OpenSpec: ${spec.id} ...`);
      const lastFailedFeedback = getLastFailedEval(spec.id);

      let prompt = `Please evaluate the following specification:\n\n<specification>\n${content}\n</specification>\n\n<example_good_response>\n{\n  "implementationAmbiguity": { "score": 5, "feedback": "Tasks are extremely clear with exact file paths and code snippets provided." },\n  "architectureConstraints": { "score": 4, "feedback": "Trade-offs between local vs remote execution are well-documented." },\n  "backwardCompatibility": { "score": 5, "feedback": "No existing systems are modified, purely additive feature." },\n  "pass": true,\n  "overallFeedback": "Excellent spec, ready for implementation."\n}\n</example_good_response>\n\n<example_bad_response>\n{\n  "implementationAmbiguity": { "score": 2, "feedback": "Tasks just say 'implement the UI' without mentioning which components or state management to use." },\n  "architectureConstraints": { "score": 1, "feedback": "Does not address how the new database tables will perform under load." },\n  "backwardCompatibility": { "score": 3, "feedback": "Mentions updating the API but doesn't specify if v1 endpoints will break." },\n  "pass": false,\n  "overallFeedback": "Spec is too ambiguous and risky. Needs more detail on database performance and exact task breakdown."\n}\n</example_bad_response>`;

      if (lastFailedFeedback) {
        prompt += `\n\n<previous_feedback>\n${JSON.stringify(lastFailedFeedback, null, 2)}\n</previous_feedback>\n\nNOTE: This spec previously failed evaluation for the reasons listed above. Ensure these issues have been addressed.`;
      }

      const evalResult = await generateWithSelfHealing(
        ai,
        "gemini-3.1-pro-preview",
        prompt,
        evalZodSchema,
        `You are an elite Staff Software Engineer reviewing a product specification. 
Your goal is to evaluate the specification based on three dimensions:
1. Implementation Ambiguity: Are the tasks clear enough for an engineer or AI agent to execute without guessing? (5 = very clear, 1 = very ambiguous)
2. Architecture Constraints: Does the design explicitly address trade-offs and risks? (5 = comprehensive, 1 = missing or poor)
3. Backward Compatibility: Does the spec address potential regressions or impacts on existing systems? (5 = safely addressed, 1 = high risk of breaking changes)

To pass, all dimensions must score at least 3 out of 5.`,
      );

      presenter.log(
        `- Ambiguity Score: ${evalResult.implementationAmbiguity.score}/5`,
      );
      presenter.log(
        `- Architecture Score: ${evalResult.architectureConstraints.score}/5`,
      );
      presenter.log(
        `- Compatibility Score: ${evalResult.backwardCompatibility.score}/5`,
      );
      presenter.log(`\nFeedback: ${evalResult.overallFeedback}`);

      saveEval(
        Date.now().toString(),
        spec.id,
        contentHash,
        evalResult.pass,
        evalResult,
      );

      if (!evalResult.pass) {
        presenter.warn(`❌ ${spec.id} FAILED the semantic pass.`);
        failedSpecs++;
      } else {
        presenter.log(`✅ ${spec.id} PASSED the semantic pass.`);
        passedSpecs++;
      }
    } catch (error) {
      presenter.warn(`Error evaluating ${spec.id}: ${error}`);
      failedSpecs++;
    }
  }

  if (failedSpecs > 0) {
    await presenter.fail(
      `${failedSpecs} specs failed evaluation. Fix them before merging.`,
      "eval_failed",
      `openspec ai-eval`,
    );
    return;
  } else {
    presenter.success(
      { passed: passedSpecs, skipped: skippedSpecs },
      "All specs passed semantic evaluation.",
    );
  }
}
