import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import { getAllSpecs } from "./utils.js";
import { checkReadiness } from "./readiness.js";
import { getLastSuccessfulEval } from "./db.js";
import { getSpecContentHash, runEvalForFeature } from "./eval.js";
import { promptUserConfirm } from "./collision.js";
import { buildContext } from "./context.js";

export async function startFeature(
  featureName: string,
  options: { nonInteractive?: boolean; autoFix?: boolean },
) {
  const specs = getAllSpecs();
  const targetSpec = specs.find((s) => s.id === featureName);

  if (!targetSpec) {
    const err = `Error: Feature '${featureName}' not found.`;
    if (options.nonInteractive)
      console.log(
        JSON.stringify({
          error: err,
          next_action: "Provide a valid feature name.",
        }),
      );
    else console.error(err);
    process.exit(1);
  }

  // 1. Check DAG readiness
  const isReady = checkReadiness(specs, featureName, options.nonInteractive);
  if (!isReady) {
    if (options.nonInteractive)
      console.log(
        JSON.stringify({
          error: "not_ready",
          next_action: "Complete dependencies first.",
        }),
      );
    process.exit(1);
  }

  // 2. Check ai-eval record and Hash-Based State Validation
  const lastSuccess = getLastSuccessfulEval(featureName);
  const currentHash = getSpecContentHash(targetSpec.dirPath, featureName);

  let requiresEval = false;
  if (!lastSuccess) {
    if (!options.nonInteractive)
      console.error(
        `❌ Spec '${featureName}' does not have a successful ai-eval record.`,
      );
    requiresEval = true;
  } else if (lastSuccess.content_hash !== currentHash) {
    if (!options.nonInteractive)
      console.error(
        `❌ Spec '${featureName}' has been modified since its last successful evaluation (hash mismatch).`,
      );
    requiresEval = true;
  }

  if (requiresEval) {
    if (options.nonInteractive) {
      if (options.autoFix) {
        // Just run eval
        if (!options.nonInteractive) console.log("Running ai-eval...");
      } else {
        console.log(
          JSON.stringify({
            error: "eval_missing_or_stale",
            next_action:
              "Run 'openspec ai-eval <feature>' or use --auto-fix=true.",
          }),
        );
        process.exit(1);
      }
    } else {
      const doEval = await promptUserConfirm(
        "Would you like to run ai-eval now?",
      );
      if (!doEval) process.exit(1);
    }

    const evalPassed = await runEvalForFeature(
      targetSpec.dirPath,
      featureName,
      options,
    );
    if (!evalPassed) {
      const err = "ai-eval failed. Fix the spec before starting.";
      if (options.nonInteractive)
        console.log(
          JSON.stringify({
            error: err,
            next_action: "Fix spec manually or use auto-fix.",
          }),
        );
      else console.error(err);
      process.exit(1);
    }
  }

  // Generate context and dump it
  const context = await buildContext(featureName, specs);
  if (!options.nonInteractive) {
    console.log(
      `\n✅ Ready to start! Provide the following context to your AI agent:\n`,
    );
    console.log(context);
  } else {
    console.log(JSON.stringify({ success: true, context }));
  }
}
