import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import fsPromises from "fs/promises";
import { swapStagingToLive } from "../stage.js";

vi.mock("fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("fs")>();
  return {
    default: {
      ...actual,
      renameSync: vi.fn(),
      mkdirSync: vi.fn(),
    },
  };
});

vi.mock("fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("fs/promises")>();
  return {
    default: {
      ...actual,
      rm: vi.fn().mockResolvedValue(undefined),
      cp: vi.fn().mockResolvedValue(undefined),
    },
  };
});

describe("swapStagingToLive", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should successfully execute a 3-step atomic swap", async () => {
    const stagingDir = ".tmp/src_staging_123e4567-e89b-12d3-a456-426614174000";
    const targetDir = "src";

    await swapStagingToLive([{ stagingPath: stagingDir, livePath: targetDir }]);

    expect(fs.renameSync).toHaveBeenCalledWith(
      targetDir,
      expect.stringContaining("_old_"),
    );
    expect(fs.renameSync).toHaveBeenCalledWith(stagingDir, targetDir);
    expect(fsPromises.rm).toHaveBeenCalledWith(
      expect.stringContaining("_old_"),
      { recursive: true, force: true },
    );
  });

  it("should handle synthetic EXDEV failures by falling back to cp/rm", async () => {
    const stagingDir = ".tmp/src_staging_123e4567-e89b-12d3-a456-426614174000";
    const targetDir = "src";

    const exdevError = new Error("Cross-device link");
    (exdevError as any).code = "EXDEV";
    vi.mocked(fs.renameSync).mockImplementationOnce(() => {
      throw exdevError;
    });

    await swapStagingToLive([{ stagingPath: stagingDir, livePath: targetDir }]);

    expect(fsPromises.cp).toHaveBeenCalledWith(
      targetDir,
      expect.stringContaining("_old_"),
      { recursive: true },
    );
    expect(fsPromises.cp).toHaveBeenCalledWith(stagingDir, targetDir, {
      recursive: true,
    });
    expect(fsPromises.rm).toHaveBeenCalledWith(stagingDir, {
      recursive: true,
      force: true,
    });
  });
});
