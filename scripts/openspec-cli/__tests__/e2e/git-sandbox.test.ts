import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { execSync } from "child_process";
import { stageIntents } from "../../stage.js";
import { TerminalPresenter } from "../../presenter.js";

const TEST_BASE_DIR = path.resolve(process.cwd(), ".tmp", `test-sandbox-${crypto.randomUUID()}`);
const OLD_CWD = process.cwd();

// FD Registry for testing
const fdRegistry = new Set<number>();

vi.mock("fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("fs")>();
  return {
    ...actual,
    openSync: vi.fn((...args: Parameters<typeof fs.openSync>) => {
      const fd = actual.openSync(...args);
      fdRegistry.add(fd);
      return fd;
    }),
    closeSync: vi.fn((fd: number) => {
      fdRegistry.delete(fd);
      return actual.closeSync(fd);
    })
  };
});

describe("E2E: Git-Native Sandboxing", () => {
  beforeEach(() => {
    // 1. Isolated sandbox (git init)
    if (fs.existsSync(TEST_BASE_DIR)) {
      fs.rmSync(TEST_BASE_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_BASE_DIR, { recursive: true });
    process.chdir(TEST_BASE_DIR);

    execSync("git init");
    execSync('git config user.email "test@example.com"');
    execSync('git config user.name "Test User"');
    fs.writeFileSync("initial.txt", "base state");
    execSync("git add .");
    execSync('git commit -m "Initial commit"');
  });

  afterEach(() => {
    process.chdir(OLD_CWD);
    
    // FD Cleanup registry execution
    if (fdRegistry.size > 0) {
      console.warn(`[FD Cleanup] Closing ${fdRegistry.size} leaked file descriptors.`);
      for (const fd of Array.from(fdRegistry)) {
        try {
          fs.closeSync(fd);
        } catch (e) {
          // Ignore
        }
      }
      fdRegistry.clear();
    }

    if (fs.existsSync(TEST_BASE_DIR)) {
      try {
        fs.rmSync(TEST_BASE_DIR, { recursive: true, force: true });
      } catch (e) {
        // Windows might hold locks, ignore cleanup errors
      }
    }
    vi.restoreAllMocks();
  });

  it("should create an isolated worktree, apply changes, and squash merge correctly", () => {
    const presenter = new TerminalPresenter(true, true);
    
    const intents = [
      {
        kind: "createFile",
        absolutePath: path.join(TEST_BASE_DIR, "new-feature.txt"),
        content: "hello world"
      }
    ];

    const { token, branchName } = stageIntents(intents, { nonInteractive: true, json: false, baseDir: TEST_BASE_DIR }, presenter);

    // Assert that the staging branch exists
    const branches = execSync("git branch --list").toString();
    expect(branches).toContain(branchName);

    // Assert that the worktree was created
    const worktreePath = path.join(TEST_BASE_DIR, ".openspec-worktrees", token);
    expect(fs.existsSync(worktreePath)).toBe(true);

    // The new file should exist IN THE WORKTREE, not in the base directory!
    expect(fs.existsSync(path.join(worktreePath, "new-feature.txt"))).toBe(true);
    expect(fs.existsSync(path.join(TEST_BASE_DIR, "new-feature.txt"))).toBe(false);

    // Now let's simulate apply (git merge --squash)
    execSync(`git merge --squash ${branchName}`);
    execSync(`git commit -m "feat: applied intent"`);

    // Now the file should exist in the base directory
    expect(fs.existsSync(path.join(TEST_BASE_DIR, "new-feature.txt"))).toBe(true);
    expect(fs.readFileSync(path.join(TEST_BASE_DIR, "new-feature.txt"), "utf8")).toBe("hello world");
  });
});
