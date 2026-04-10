import * as fs from "fs";
import * as path from "path";
import { TerminalPresenter, isHeadless } from "./presenter.js";
import { CliOptions } from "./schema.js";
import { FsIntent, FsExecutor } from "./fs-intents.js";
import { stageIntents, cleanupOldStaged } from "./stage.js";

export async function archiveFeature(featureName: string, options: CliOptions) {
  const presenter = new TerminalPresenter(
    options.nonInteractive || isHeadless(),
    options.json,
  );

  const changesDir = path.resolve(
    process.cwd(),
    "openspec",
    "changes",
    featureName,
  );
  if (!fs.existsSync(changesDir)) {
    await presenter.fail(
      `Feature '${featureName}' not found in openspec/changes/`,
    );
    return;
  }

  const archiveDir = path.resolve(
    process.cwd(),
    "openspec",
    "archive",
    "changes",
  );
  const destDir = path.join(archiveDir, featureName);

  const intents: FsIntent[] = [
    { kind: "mkdir", absolutePath: archiveDir },
    { kind: "gitMove", oldPath: changesDir, newPath: destDir },
  ];

  // Try to find a related plan file to archive
  const plansDir = path.resolve(process.cwd(), "openspec", "plans");
  if (fs.existsSync(plansDir)) {
    const plans = fs.readdirSync(plansDir).filter((f) => f.endsWith(".md"));
    // Naive matching: if plan filename includes featureName
    for (const plan of plans) {
      if (plan.includes(featureName)) {
        const planOldPath = path.join(plansDir, plan);
        const planArchiveDir = path.resolve(
          process.cwd(),
          "openspec",
          "archive",
          "plans",
        );
        intents.push(
          { kind: "mkdir", absolutePath: planArchiveDir },
          {
            kind: "gitMove",
            oldPath: planOldPath,
            newPath: path.join(planArchiveDir, plan),
          },
        );
      }
    }
  }

  cleanupOldStaged(options);

  if (options.stage && !options.force) {
    const staged = stageIntents(intents, options, presenter);
    await presenter.success(
      { staged: true, token: staged.token, diffUris: staged.diffUris },
      `Archive staged.\nReview Diff URIs:\n${staged.diffUris.join("\n")}\nRun 'npm run openspec apply --token=${staged.token}' to commit.`,
    );
    return;
  }

  const executor = new FsExecutor(options.dryRun, presenter);
  executor.execute(intents);

  presenter.success(
    { success: true, featureName, archivedPath: destDir },
    `Successfully archived ${featureName} to ${destDir}`,
  );
}
