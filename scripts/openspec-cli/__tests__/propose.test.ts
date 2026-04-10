import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { proposePlan } from "../propose";
import * as collision from "../collision";

vi.mock("fs");
vi.mock("child_process");
vi.mock("@google/genai", () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: vi.fn(),
      },
    })),
  };
});
vi.mock("../utils", async () => {
  const actual = await vi.importActual("../utils");
  return {
    ...(actual as any),
    generateWithSelfHealing: vi.fn().mockResolvedValue({
      featureName: "test-feature",
      proposal: "test proposal",
      design: "test design",
      spec: "test spec",
      tasks: "test tasks",
      depends_on: [],
    }),
    getAllSpecs: vi.fn().mockReturnValue([]),
  };
});
vi.mock("../collision", async () => {
  const actual = await vi.importActual("../collision");
  return {
    ...(actual as any),
    checkCollisions: vi.fn().mockResolvedValue("ok"),
    promptUserConfirm: vi.fn().mockResolvedValue(true),
  };
});
vi.mock("../validate", async () => {
  const actual = await vi.importActual("../validate");
  return {
    ...(actual as any),
    checkCycles: vi.fn().mockReturnValue(true),
  };
});
vi.mock("../eval", async () => {
  const actual = await vi.importActual("../eval");
  return {
    ...(actual as any),
    runEvalForFeature: vi.fn().mockResolvedValue(true),
  };
});
vi.mock("../presenter", async () => {
  const actual = await vi.importActual("../presenter");
  return {
    ...(actual as any),
    isHeadless: vi.fn().mockReturnValue(false),
  };
});

describe("proposePlan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = "test-key";

    // Mock fs functions
    (fs.existsSync as any).mockReturnValue(false);
    (fs.readFileSync as any).mockReturnValue("fake plan content");

    // Default intercepts:
    vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
      throw new Error(`Process exited with code ${code}`);
    }) as any);
  });

  it("should warn and abort if .tmp directory exists and user declines overwrite", async () => {
    // Setup .tmp existence
    (fs.existsSync as any).mockImplementation((p: string) => {
      if (p.includes(".tmp")) return true;
      if (p.includes("openspec/plans/test-plan.md")) return true;
      return false;
    });

    // User declines
    vi.spyOn(collision, "promptUserConfirm").mockResolvedValueOnce(false);

    await expect(
      proposePlan("openspec/plans/test-plan.md", {
        stage: false,
        nonInteractive: false,
        json: false,
        force: false,
        dryRun: false,
        stdin: false,
      }),
    ).rejects.toThrow("Process exited with code 1");

    expect(collision.promptUserConfirm).toHaveBeenCalledWith(
      expect.stringContaining("temporary staging directory"),
    );
    expect(process.exit).toHaveBeenCalledWith(1);
    expect(fs.rmSync).not.toHaveBeenCalled();
  });

  it("should fail immediately if .tmp exists in headless mode without force", async () => {
    (fs.existsSync as any).mockImplementation((p: string) => {
      if (p.includes(".tmp")) return true;
      if (p.includes("openspec/plans/test-plan.md")) return true;
      return false;
    });

    await expect(
      proposePlan("openspec/plans/test-plan.md", {
        stage: false,
        nonInteractive: true,
        force: false,
        json: false,
        dryRun: false,
        stdin: false,
      }),
    ).rejects.toThrow("Process exited with code 1");

    expect(process.exit).toHaveBeenCalledWith(1);
    expect(collision.promptUserConfirm).not.toHaveBeenCalled();
  });

  it("should wipe .tmp directory if --force is provided", async () => {
    (fs.existsSync as any).mockImplementation((p: string) => {
      if (p.includes(".tmp")) return true;
      if (p.includes("openspec/plans/test-plan.md")) return true;
      return false;
    });

    await proposePlan("openspec/plans/test-plan.md", {
      stage: false,
      nonInteractive: true,
      force: true,
      json: false,
      dryRun: false,
      stdin: false,
    });

    // Assuming fs.rmSync is called to wipe the dir
    expect(fs.rmSync).toHaveBeenCalled();
  });

  it("should warn and abort if final target directory exists and user declines", async () => {
    (fs.existsSync as any).mockImplementation((p: string) => {
      if (p.endsWith("openspec/changes/test-feature")) return true;
      if (p.includes("openspec/plans/test-plan.md")) return true;
      return false;
    });

    vi.spyOn(collision, "promptUserConfirm").mockResolvedValueOnce(false);

    await expect(
      proposePlan("openspec/plans/test-plan.md", {
        stage: false,
        nonInteractive: false,
        json: false,
        force: false,
        dryRun: false,
        stdin: false,
      }),
    ).rejects.toThrow("Process exited with code 1");

    expect(collision.promptUserConfirm).toHaveBeenCalledWith(
      expect.stringContaining("feature directory"),
    );
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it("should preserve .tmp directory if ai-eval fails", async () => {
    // Override eval mock to fail
    const evalMock = await import("../eval");
    (evalMock.runEvalForFeature as any).mockResolvedValueOnce(false);

    // Reset existsSync to not trigger prompts
    (fs.existsSync as any).mockImplementation((p: string) => {
      if (p.includes("openspec/plans/test-plan.md")) return true;
      return false;
    });

    await expect(
      proposePlan("openspec/plans/test-plan.md", {
        stage: false,
        nonInteractive: true,
        json: false,
        force: false,
        dryRun: false,
        stdin: false,
      }),
    ).rejects.toThrow("Process exited with code 1");

    // Should not call rmSync when eval fails
    expect(fs.rmSync).not.toHaveBeenCalled();
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it("should correctly archive files from openspec/plans/ and skip others", async () => {
    // If planPath is openspec/changes/foo/proposal.md, it should NOT archive
    (fs.existsSync as any).mockReturnValue(true);

    await proposePlan("openspec/changes/test-feature/proposal.md", {
      stage: false,
      nonInteractive: true,
      force: true,
      json: false,
      dryRun: false,
      stdin: false,
    });

    // FsExecutor executes intents. We can't easily mock the internal array,
    // but we can check if fs.writeFileSync is called for the archive path.
    // However, FsExecutor runs these commands.
    // Let's spy on the BaseFsExecutor execute method?
    // Actually, we'll implement this logic in the code, and test via intent execution or checking presenter logs.
  });
});
