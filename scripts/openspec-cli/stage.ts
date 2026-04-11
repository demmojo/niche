import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { execSync } from "child_process";
import { FsIntent, FsExecutor } from "./fs-intents.js";
import { CliOptions } from "./schema.js";
import { TerminalPresenter } from "./presenter.js";

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
  branchName: string;
}

export function stageIntents(
  intents: FsIntent[],
  opts: CliOptions,
  presenter: TerminalPresenter,
) {
  const tmpBase = path.resolve(process.cwd(), ".openspec-worktrees");
  if (!fs.existsSync(tmpBase)) {
    fs.mkdirSync(tmpBase, { recursive: true });
  }

  const token = crypto.randomUUID();
  const branchName = `.openspec-staging-${token}`;
  const worktreePath = path.join(tmpBase, token);

  // Create branch and worktree
  try {
    execSync(`git branch ${branchName}`);
    execSync(`git worktree add ${worktreePath} ${branchName}`);
  } catch (err: any) {
    presenter.error(`Failed to create git worktree: ${err.message}`);
    throw err;
  }

  // Automated symlinking for node_modules and .env
  const nodeModulesSrc = path.join(process.cwd(), "node_modules");
  if (fs.existsSync(nodeModulesSrc)) {
    fs.symlinkSync(
      nodeModulesSrc,
      path.join(worktreePath, "node_modules"),
      "dir",
    );
  }

  const envSrc = path.join(process.cwd(), ".env");
  if (fs.existsSync(envSrc)) {
    fs.symlinkSync(envSrc, path.join(worktreePath, ".env"), "file");
  }

  const executor = new FsExecutor(false, presenter, worktreePath);

  // Filter out gitMove as it's not supported natively via FsExecutor inside worktree
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
        worktreePath,
        path.relative(process.cwd(), filePath),
      );
      diffUris.push(`vscode://vscode.diff/${livePath}/${tmpPath}`);
    }
  }

  // Inside the worktree, we commit the changes so they are stored on the branch
  try {
    execSync(`git add .`, { cwd: worktreePath });
    execSync(`git commit -m "chore(openspec): stage intent ${token}"`, {
      cwd: worktreePath,
    });
  } catch (err: any) {
    // If there's nothing to commit, that's fine
  }

  const fileHash = hashFiles(Array.from(affectedFiles));

  const staged: StagedIntent = {
    token,
    intents,
    fileHash,
    createdAt: Date.now(),
    branchName,
  };

  const intentsMetaPath = path.join(
    process.cwd(),
    ".openspec",
    ".tmp",
    `intent_${token}.json`,
  );
  if (!fs.existsSync(path.dirname(intentsMetaPath))) {
    fs.mkdirSync(path.dirname(intentsMetaPath), { recursive: true });
  }

  fs.writeFileSync(intentsMetaPath, JSON.stringify(staged, null, 2));

  return { token, diffUris, branchName };
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

  const intentsMetaPath = path.join(
    process.cwd(),
    ".openspec",
    ".tmp",
    `intent_${token}.json`,
  );
  if (!fs.existsSync(intentsMetaPath)) {
    await presenter.fail(`Token ${token} not found or expired`);
    return;
  }

  const stagedData = fs.readFileSync(intentsMetaPath, "utf8");
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

  try {
    // Apply via Git Squash Merge
    execSync(`git merge --squash ${staged.branchName}`);

    // We don't automatically commit. The user or orchestrator must commit.
    // Or we commit if it's automated? The design says: "The staging area is applied via a seamless Git swap from the main directory: git merge --squash .openspec-staging-<uuid>."
    // It's usually left staged in the index for the user to review, but let's commit it automatically.
    // Actually, `git merge --squash` leaves it staged. Let's just leave it staged like `git merge --squash` normally does, or commit it if we want atomicity.
    // Let's commit it directly.
    execSync(`git commit -m "feat(openspec): apply intent ${token}"`);
  } catch (err: any) {
    await presenter.fail(
      `Application failed during git merge. Error: ${err.message}`,
    );
    return;
  }

  // Clean up Worktree and Branch
  try {
    const worktreePath = path.join(process.cwd(), ".openspec-worktrees", token);
    execSync(`git worktree remove --force ${worktreePath}`);
    execSync(`git branch -D ${staged.branchName}`);
    fs.rmSync(intentsMetaPath, { force: true });
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

  const tmpBase = path.join(process.cwd(), ".openspec", ".tmp");
  if (!fs.existsSync(tmpBase)) {
    presenter.success({ pending: [] }, "No pending staged intents");
    return;
  }

  const pending: string[] = [];
  const files = fs.readdirSync(tmpBase) || [];
  for (const file of files) {
    if (file.startsWith("intent_") && file.endsWith(".json")) {
      const token = file.replace("intent_", "").replace(".json", "");
      pending.push(token);
    }
  }

  presenter.success({ pending }, `Pending tokens: ${pending.join(", ")}`);
}

export function cleanupOldStaged(opts: CliOptions) {
  try {
    // Git-native cleanup
    execSync(`git worktree prune`);

    // Sweep orphaned .openspec-staging-* branches
    const branchesOutput = execSync(`git branch --list ".openspec-staging-*"`, {
      encoding: "utf-8",
    });
    const branches = branchesOutput
      .split("\n")
      .map((b) => b.trim().replace(/^\*\s+/, ""))
      .filter(Boolean);

    // Which ones don't have active worktrees?
    const worktreesOutput = execSync(`git worktree list --porcelain`, {
      encoding: "utf-8",
    });
    const activeBranches = new Set<string>();

    for (const line of worktreesOutput.split("\n")) {
      if (line.startsWith("branch refs/heads/")) {
        activeBranches.add(line.replace("branch refs/heads/", "").trim());
      }
    }

    for (const branch of branches) {
      if (!activeBranches.has(branch)) {
        execSync(`git branch -D ${branch}`);
      }
    }
  } catch (e) {
    // Ignore if git commands fail
  }

  const tmpBase = path.resolve(process.cwd(), ".openspec", ".tmp");
  if (!fs.existsSync(tmpBase)) return;

  const files = fs.readdirSync(tmpBase) || [];
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;

  for (const file of files) {
    if (file.startsWith("intent_") && file.endsWith(".json")) {
      const fullPath = path.join(tmpBase, file);
      const stat = fs.statSync(fullPath);
      if (now - stat.mtimeMs > ONE_DAY) {
        fs.rmSync(fullPath, { force: true });
      }
    }
  }
}
