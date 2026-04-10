import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { execSync } from "child_process";
import { FsIntent, FsExecutor } from "./fs-intents.js";
import { CliOptions } from "./schema.js";

// Hashing only the specific files affected
function hashFiles(files: string[]): string {
  const hash = crypto.createHash("sha256");
  for (const file of files) {
    if (fs.existsSync(file)) {
      hash.update(fs.readFileSync(file));
    } else {
      hash.update(`__missing__${file}`);
    }
  }
  return hash.digest("hex");
}

export interface StagedIntent {
  token: string;
  intents: FsIntent[];
  fileHash: string;
  createdAt: number;
}

export function stageIntents(
  intents: FsIntent[],
  opts: CliOptions,
  presenter: any,
) {
  const tmpBase = path.resolve(process.cwd(), ".tmp");
  if (!fs.existsSync(tmpBase)) {
    fs.mkdirSync(tmpBase, { recursive: true });
  }

  const token = crypto.randomBytes(8).toString("hex");
  const stageDir = path.join(tmpBase, `openspec_${token}`);
  const sandboxRoot = path.join(stageDir, "root");
  fs.mkdirSync(sandboxRoot, { recursive: true });

  const executor = new FsExecutor(false, presenter, sandboxRoot);

  // Filter out gitMove as it's not supported in staging
  const stagingIntents = intents.filter((i) => i.kind !== "gitMove");
  executor.execute(stagingIntents);

  const affectedFiles = new Set<string>();
  const diffUris: string[] = [];

  for (const intent of intents) {
    let filePath: string | null = null;
    let newPath: string | null = null;
    if ("absolutePath" in intent) filePath = intent.absolutePath;
    if ("oldPath" in intent) {
      filePath = intent.oldPath;
      newPath = intent.newPath;
    }

    if (filePath) affectedFiles.add(filePath);
    if (newPath) affectedFiles.add(newPath);

    if (
      filePath &&
      !fs.statSync(filePath, { throwIfNoEntry: false })?.isDirectory()
    ) {
      const livePath = filePath;
      const tmpPath = path.join(
        sandboxRoot,
        path.relative(process.cwd(), filePath),
      );
      diffUris.push(`vscode://vscode.diff/${livePath}/${tmpPath}`);
    }
  }

  const fileHash = hashFiles(Array.from(affectedFiles));

  const staged: StagedIntent = {
    token,
    intents,
    fileHash,
    createdAt: Date.now(),
  };

  fs.writeFileSync(
    path.join(stageDir, "intents.json"),
    JSON.stringify(staged, null, 2),
  );

  // Generate real diff
  const diffFile = path.join(stageDir, "preview.diff");
  const fd = fs.openSync(diffFile, "w");
  try {
    // We ignore the exit code because git diff returns 1 if differences are found
    const spawnSync = execSync; // Hack to use sync process
    try {
      execSync(
        `git diff --no-index "${process.cwd()}" "${sandboxRoot}" > "${diffFile}" 2>&1`,
      );
    } catch (e) {
      // git diff exits 1 if differences found
    }
  } finally {
    fs.closeSync(fd);
  }

  return { token, diffUris };
}

export async function applyStaged(opts: CliOptions) {
  const { TerminalPresenter, isHeadless } = await import("./presenter.js");
  const presenter = new TerminalPresenter(
    opts.nonInteractive || isHeadless(),
    opts.json,
  );

  const token = opts.token;
  if (!token) {
    await presenter.fail("Must provide --token to apply");
    return;
  }

  const tmpBase = path.resolve(process.cwd(), ".tmp");
  const stageDir = path.join(tmpBase, `openspec_${token}`);
  if (!fs.existsSync(stageDir)) {
    await presenter.fail(`Token ${token} not found or expired`);
    return;
  }

  const stagedData = fs.readFileSync(
    path.join(stageDir, "intents.json"),
    "utf8",
  );
  const staged: StagedIntent = JSON.parse(stagedData);

  const affectedFiles = new Set<string>();
  for (const intent of staged.intents) {
    if ("absolutePath" in intent) affectedFiles.add(intent.absolutePath);
    if ("oldPath" in intent) {
      affectedFiles.add(intent.oldPath);
      affectedFiles.add(intent.newPath);
    }
  }

  const currentHash = hashFiles(Array.from(affectedFiles));
  if (currentHash !== staged.fileHash && !opts.force) {
    await presenter.fail(
      "TOCTOU Drift detected: Affected files have changed since staging",
    );
    return;
  }

  // Application Ledger: Backup before applying
  const backupDir = path.join(stageDir, "backup");
  fs.mkdirSync(backupDir, { recursive: true });
  const ledger: { livePath: string; backupPath: string | null }[] = [];

  for (const intent of staged.intents) {
    const target =
      "absolutePath" in intent ? intent.absolutePath : intent.oldPath;
    if (!target) continue;

    if (fs.existsSync(target)) {
      const bPath = path.join(backupDir, path.relative(process.cwd(), target));
      fs.mkdirSync(path.dirname(bPath), { recursive: true });
      fs.cpSync(target, bPath, {
        recursive: true,
        preserveTimestamps: true,
        dereference: false,
      });
      ledger.push({ livePath: target, backupPath: bPath });
    } else {
      ledger.push({ livePath: target, backupPath: null }); // Didn't exist
    }
  }

  try {
    const sandboxRoot = path.join(stageDir, "root");
    const executor = new FsExecutor(
      false,
      presenter,
      opts.force ? undefined : undefined,
    ); // Wait, force means direct write?
    // Actually, apply always writes directly to the live file system.
    const liveExecutor = new FsExecutor(false, presenter);
    liveExecutor.execute(staged.intents);
  } catch (err) {
    // Rollback Ledger
    for (let i = ledger.length - 1; i >= 0; i--) {
      const entry = ledger[i];
      try {
        if (entry.backupPath) {
          fs.cpSync(entry.backupPath, entry.livePath, {
            recursive: true,
            preserveTimestamps: true,
            dereference: false,
          });
        } else {
          fs.rmSync(entry.livePath, { recursive: true, force: true });
        }
      } catch (rollbackErr) {
        presenter.error(`Failed to rollback ${entry.livePath}: ${rollbackErr}`);
      }
    }
    await presenter.fail(
      `Application failed, rollback executed. Error: ${err}`,
    );
    return;
  }

  // Clean up
  try {
    fs.rmSync(stageDir, { recursive: true, force: true });
  } catch (e) {
    // Ignore cleanup errors
  }

  await presenter.success(
    { token, applied: true },
    `Successfully applied intent ${token}`,
  );
}

export async function statusStaged(opts: CliOptions) {
  const { TerminalPresenter, isHeadless } = await import("./presenter.js");
  const presenter = new TerminalPresenter(
    opts.nonInteractive || isHeadless(),
    opts.json,
  );

  const tmpBase = path.resolve(process.cwd(), ".tmp");
  if (!fs.existsSync(tmpBase)) {
    presenter.success({ pending: [] }, "No pending staged intents");
    return;
  }

  const pending: string[] = [];
  const dirs = fs.readdirSync(tmpBase);
  for (const dir of dirs) {
    if (dir.startsWith("openspec_")) {
      const token = dir.replace("openspec_", "");
      pending.push(token);
    }
  }

  presenter.success({ pending }, `Pending tokens: ${pending.join(", ")}`);
}

export function cleanupOldStaged(opts: CliOptions) {
  const tmpBase = path.resolve(process.cwd(), ".tmp");
  if (!fs.existsSync(tmpBase)) return;

  const dirs = fs.readdirSync(tmpBase);
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;

  for (const fileOrDir of dirs) {
    const fullPath = path.join(tmpBase, fileOrDir);
    const stat = fs.statSync(fullPath);
    if (now - stat.mtimeMs > ONE_DAY) {
      if (stat.isDirectory()) {
        fs.rmSync(fullPath, { recursive: true, force: true });
      } else {
        fs.rmSync(fullPath, { force: true });
      }
    }
  }
}
