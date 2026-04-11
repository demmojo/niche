import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import { getAllSpecs } from "./utils.js";
import { checkReadiness } from "./readiness.js";
import { getLastSuccessfulEval } from "./db.js";
import { getSpecContentHash, runEvalForFeature } from "./eval.js";
import { promptUserConfirm } from "./collision.js";
import { buildContext } from "./context.js";
import { CliOptions } from "./schema.js";
import { TerminalPresenter, isHeadless } from "./presenter.js";

export async function startFeature(featureName: string, options: CliOptions) {
  const presenter = new TerminalPresenter(
    options.nonInteractive || isHeadless(),
    options.json,
  );

  const specs = getAllSpecs();
  const targetSpec = specs.find((s) => s.id === featureName);

  if (!targetSpec) {
    await presenter.fail(
      `Feature '${featureName}' not found.`,
      "feature_not_found",
      `openspec start <valid-feature-name>`,
    );
    return;
  }

  // 1. Check DAG readiness
  const isReady = checkReadiness(specs, featureName, options.nonInteractive);
  if (!isReady) {
    await presenter.fail(
      `Feature '${featureName}' is not ready. Complete dependencies first.`,
      "not_ready",
      `openspec check-ready ${featureName}`,
    );
    return;
  }

  // 2. Check ai-eval record and Hash-Based State Validation
  const lastSuccess = getLastSuccessfulEval(featureName);
  const currentHash = getSpecContentHash(targetSpec.dirPath, featureName);

  let requiresEval = false;
  if (!lastSuccess) {
    presenter.warn(
      `❌ Spec '${featureName}' does not have a successful ai-eval record.`,
    );
    requiresEval = true;
  } else if (lastSuccess.content_hash !== currentHash) {
    presenter.warn(
      `❌ Spec '${featureName}' has been modified since its last successful evaluation (hash mismatch).`,
    );
    requiresEval = true;
  }

  if (requiresEval) {
    const isHeadlessEnv = options.nonInteractive || isHeadless();

    if (isHeadlessEnv || options.autoFix !== undefined) {
      if (options.autoFix || options.force) {
        // Just run eval
        presenter.log("Running ai-eval...");
      } else {
        await presenter.fail(
          "Spec requires evaluation, but autoFix is disabled in headless mode.",
          "eval_missing_or_stale",
          `openspec start ${featureName} --auto-fix`,
        );
        return;
      }
    } else {
      const doEval = await promptUserConfirm(
        "Would you like to run ai-eval now?",
      );
      if (!doEval) await presenter.safeExit(1);
      return;
    }

    const evalPassed = await runEvalForFeature(
      targetSpec.dirPath,
      featureName,
      options,
    );
    if (!evalPassed) {
      await presenter.fail(
        "ai-eval failed. Fix the spec before starting.",
        "eval_failed",
        `openspec start ${featureName} --auto-fix`,
      );
      return;
    }
  }

  // Generate context and dump it
  const context = await buildContext(featureName, specs);
  presenter.success(
    { context },
    `\n✅ Ready to start! Provide the following context to your AI agent:\n\n${context}`,
  );
}
