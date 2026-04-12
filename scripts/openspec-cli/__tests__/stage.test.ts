import { describe, it, expect, vi, beforeEach } from "vitest";
import child_process from "child_process";
import { stageChanges } from "../stage.js";

vi.mock("child_process", () => {
  return {
    default: {
      spawnSync: vi.fn(),
    },
  };
});

describe("stage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should bypass empty commits using git diff --cached --quiet", async () => {
    // Mock git diff --cached --quiet to return 0 (no changes)
    vi.mocked(child_process.spawnSync).mockReturnValueOnce({
      status: 0,
      stdout: Buffer.from(""),
      stderr: Buffer.from(""),
      pid: 1,
      output: [],
      signal: null,
    });

    await stageChanges();

    expect(child_process.spawnSync).toHaveBeenCalledWith(
      "git",
      ["diff", "--cached", "--quiet"],
      expect.any(Object),
    );
    // Should not call git commit if diff --quiet returns 0
    expect(child_process.spawnSync).not.toHaveBeenCalledWith(
      "git",
      ["commit", expect.any(String)],
      expect.any(Object),
    );
  });

  it("should verify git commit --no-verify successfully bypasses local pre-commit hooks", async () => {
    // Mock git diff --cached --quiet to return 1 (changes exist)
    vi.mocked(child_process.spawnSync).mockReturnValueOnce({
      status: 1,
      stdout: Buffer.from(""),
      stderr: Buffer.from(""),
      pid: 1,
      output: [],
      signal: null,
    });
    // Mock git commit to succeed
    vi.mocked(child_process.spawnSync).mockReturnValueOnce({
      status: 0,
      stdout: Buffer.from(""),
      stderr: Buffer.from(""),
      pid: 1,
      output: [],
      signal: null,
    });

    await stageChanges();

    expect(child_process.spawnSync).toHaveBeenCalledWith(
      "git",
      ["diff", "--cached", "--quiet"],
      expect.any(Object),
    );
    expect(child_process.spawnSync).toHaveBeenCalledWith(
      "git",
      ["commit", "--no-verify", "-m", "OpenSpec staging auto-commit"],
      expect.any(Object),
    );
  });
});
