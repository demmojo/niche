import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { execSync } from "child_process";
import { stageIntents, applyStaged, statusStaged, cleanupOldStaged } from "../stage.js";

vi.mock("fs");
vi.mock("child_process");
vi.mock("crypto");

describe("Stage Module", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("stageIntents", () => {
    it("should create worktree and save intent metadata", () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      vi.mocked(crypto.randomUUID).mockReturnValue("test-uuid" as any);
      vi.mocked(crypto.createHash).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        digest: vi.fn().mockReturnValue("hash123")
      } as any);

      const presenterSpy = { error: vi.fn() };
      const intents: any[] = [
        { kind: "createFile", absolutePath: path.join(process.cwd(), "some/path.txt"), content: "data" },
        { kind: "moveFile", oldPath: path.join(process.cwd(), "old.txt"), newPath: path.join(process.cwd(), "new.txt") }
      ];

      vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => false } as any);

      const result = stageIntents(intents, {} as any, presenterSpy as any);
      expect(result.token).toBe("test-uuid");
      expect(result.branchName).toBe("openspec-staging-test-uuid");

      expect(execSync).toHaveBeenCalledWith(expect.stringContaining("git branch openspec-staging-test-uuid"));
      expect(execSync).toHaveBeenCalledWith(expect.stringContaining("git worktree add"));
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining("intent_test-uuid.json"),
        expect.any(String)
      );
    });

    it("should symlink node_modules and .env if they exist", () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(crypto.randomUUID).mockReturnValue("test-uuid" as any);
      vi.mocked(crypto.createHash).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        digest: vi.fn().mockReturnValue("hash123")
      } as any);

      const presenterSpy = { error: vi.fn() };
      stageIntents([], {} as any, presenterSpy as any);

      expect(fs.symlinkSync).toHaveBeenCalledWith(expect.stringContaining("node_modules"), expect.any(String), "dir");
      expect(fs.symlinkSync).toHaveBeenCalledWith(expect.stringContaining(".env"), expect.any(String), "file");
    });
  });

  describe("applyStaged", () => {
    it("should fail if no token provided", async () => {
      const presenterSpy = { fail: vi.fn() };
      vi.doMock("../presenter.js", () => ({
        TerminalPresenter: vi.fn().mockImplementation(() => presenterSpy),
        isHeadless: () => true
      }));

      const { applyStaged: applyStagedFn } = await import("../stage.js");
      await applyStagedFn({} as any);
      expect(presenterSpy.fail).toHaveBeenCalledWith("Must provide --token to apply");
    });

    it("should fail if token not found", async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      const presenterSpy = { fail: vi.fn() };
      vi.doMock("../presenter.js", () => ({
        TerminalPresenter: vi.fn().mockImplementation(() => presenterSpy),
        isHeadless: () => true
      }));

      const originalTTY = process.stdout.isTTY;
      process.stdout.isTTY = true;

      const { applyStaged: applyStagedFn } = await import("../stage.js");
      await applyStagedFn({ token: "invalid" } as any);
      expect(presenterSpy.fail).toHaveBeenCalledWith("Token invalid not found or expired");
      
      process.stdout.isTTY = originalTTY;
    });

    it("should apply staged intents via git merge squash", async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
        token: "test-token",
        branchName: "openspec-staging-test-token",
        fileHash: "hash123",
        intents: [],
        createdAt: 1000
      }));
      vi.mocked(crypto.createHash).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        digest: vi.fn().mockReturnValue("hash123") // Matches staged hash
      } as any);
      
      // Override process.stdout.isTTY temporarily for test
      const originalTTY = process.stdout.isTTY;
      process.stdout.isTTY = true;

      const presenterSpy = { fail: vi.fn(), success: vi.fn() };
      vi.doMock("../presenter.js", () => ({
        TerminalPresenter: vi.fn().mockImplementation(() => presenterSpy),
        isHeadless: () => true
      }));

      const { applyStaged: applyStagedFn } = await import("../stage.js");
      await applyStagedFn({ token: "test-token" } as any);

      expect(execSync).toHaveBeenCalledWith("git merge --squash openspec-staging-test-token");
      expect(presenterSpy.success).toHaveBeenCalledWith({ token: "test-token", applied: true }, expect.any(String));

      process.stdout.isTTY = originalTTY;
    });

    it("should safely ignore errors during worktree removal in applyStaged", async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
        token: "test-token",
        branchName: "openspec-staging-test-token",
        fileHash: "hash123",
        intents: [],
        createdAt: 1000
      }));
      vi.mocked(crypto.createHash).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        digest: vi.fn().mockReturnValue("hash123") // Matches staged hash
      } as any);

      // Mock execSync to throw on worktree remove
      vi.mocked(execSync).mockImplementation((cmd: string) => {
        if (cmd.includes("worktree remove")) throw new Error("mock cleanup error");
        return Buffer.from("");
      });

      const presenterSpy = { fail: vi.fn(), success: vi.fn() };
      vi.doMock("../presenter.js", () => ({
        TerminalPresenter: vi.fn().mockImplementation(() => presenterSpy),
        isHeadless: () => true
      }));

      const originalTTY = process.stdout.isTTY;
      process.stdout.isTTY = true;
      const { applyStaged: applyStagedFn } = await import("../stage.js");
      await applyStagedFn({ token: "test-token" } as any);
      process.stdout.isTTY = originalTTY;

      expect(presenterSpy.success).toHaveBeenCalled();
    });
  });

  describe("statusStaged", () => {
    it("should report no pending intents if folder is missing", async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      const presenterSpy = { success: vi.fn() };
      vi.doMock("../presenter.js", () => ({
        TerminalPresenter: vi.fn().mockImplementation(() => presenterSpy),
        isHeadless: () => true
      }));

      const { statusStaged: statusStagedFn } = await import("../stage.js");
      await statusStagedFn({} as any);
      expect(presenterSpy.success).toHaveBeenCalledWith({ pending: [] }, "No pending staged intents");
    });

    it("should list pending tokens", async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue(["intent_abc.json", "other.txt"] as any);
      const presenterSpy = { success: vi.fn() };
      vi.doMock("../presenter.js", () => ({
        TerminalPresenter: vi.fn().mockImplementation(() => presenterSpy),
        isHeadless: () => true
      }));

      const { statusStaged: statusStagedFn } = await import("../stage.js");
      await statusStagedFn({} as any);
      expect(presenterSpy.success).toHaveBeenCalledWith({ pending: ["abc"] }, "Pending tokens: abc");
    });
  });

  describe("cleanupOldStaged", () => {
    it("should run git worktree prune and remove old intent files", () => {
      vi.mocked(execSync).mockImplementation((cmd: string) => {
        if (cmd.includes("git branch")) return "openspec-staging-abc\nopenspec-staging-def";
        if (cmd.includes("worktree list")) return "branch refs/heads/openspec-staging-abc";
        return Buffer.from("");
      });
      
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue(["intent_def.json"] as any);
      vi.mocked(fs.statSync).mockReturnValue({ mtimeMs: 0 } as any); // very old

      cleanupOldStaged({} as any);

      // It should delete the branch that doesn't have an active worktree (def)
      expect(execSync).toHaveBeenCalledWith("git branch -D openspec-staging-def");
      // It should delete the old intent file
      expect(fs.rmSync).toHaveBeenCalledWith(expect.stringContaining("intent_def.json"), { force: true });
    });

    it("should ignore git command errors during cleanup", () => {
      vi.mocked(execSync).mockImplementation(() => { throw new Error("git error") });
      vi.mocked(fs.existsSync).mockReturnValue(false); // don't test file deletion part
      expect(() => cleanupOldStaged({} as any)).not.toThrow();
    });
  });
});
