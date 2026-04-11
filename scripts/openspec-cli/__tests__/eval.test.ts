import { describe, it, expect, vi, beforeEach } from "vitest";
import { runEval } from "../eval.js";
import * as fs from "fs";
import * as db from "../db.js";
import * as utils from "../utils.js";

vi.mock("fs");
vi.mock("../db.js");
vi.mock("../utils.js", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    generateWithSelfHealing: vi.fn(),
    hashString: vi.fn(),
  };
});

// Avoid executing real genai
vi.mock("@google/genai", () => ({
  GoogleGenAI: class MockGenAI {},
}));

describe("runEval", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("GEMINI_API_KEY", "test-key");
  });

  it("should skip eval if no GEMINI_API_KEY is present", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const consoleWarnSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await runEval([], {
      stage: false,
      nonInteractive: true,
      json: false,
      force: false,
      dryRun: false,
      stdin: false,
    });

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "Skipping eval: GEMINI_API_KEY is not set.",
    );
    consoleWarnSpy.mockRestore();
  });

  it("should skip if no specs are in draft or proposed state", async () => {
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await runEval(
      [
        {
          id: "test",
          dirPath: "",
          yamlPath: "",
          data: { status: "implemented" },
        },
      ] as any,
      {
        stage: false,
        nonInteractive: true,
        json: false,
        force: false,
        dryRun: false,
        stdin: false,
      },
    );

    expect(consoleLogSpy).toHaveBeenCalledWith(
      "No specs in 'draft' or 'proposed' state to evaluate.",
    );
    consoleLogSpy.mockRestore();
  });

  it("should run eval and pass successfully", async () => {
    const specs: any[] = [
      {
        id: "test",
        dirPath: "openspec/changes/test",
        yamlPath: "",
        data: { status: "draft" },
      },
    ];

    vi.mocked(fs.readFileSync).mockReturnValue("dummy content");
    vi.mocked(utils.hashString).mockReturnValue("hash123");
    vi.mocked(db.getLastFailedEval).mockReturnValue(null);
    vi.mocked(db.saveEval).mockImplementation(() => {});

    vi.mocked(utils.generateWithSelfHealing).mockResolvedValue({
      implementationAmbiguity: { score: 5, feedback: "good" },
      architectureConstraints: { score: 5, feedback: "good" },
      backwardCompatibility: { score: 5, feedback: "good" },
      pass: true,
      overallFeedback: "looks good",
    });

    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await runEval(specs, {
      stage: false,
      nonInteractive: true,
      json: false,
      force: false,
      dryRun: false,
      stdin: false,
    });

    expect(utils.generateWithSelfHealing).toHaveBeenCalled();
    expect(db.saveEval).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining("PASSED"),
    );

    consoleLogSpy.mockRestore();
  });

  it("should throw an error if any specs fail", async () => {
    const specs: any[] = [
      {
        id: "test",
        dirPath: "openspec/changes/test",
        yamlPath: "",
        data: { status: "draft" },
      },
    ];

    vi.mocked(fs.readFileSync).mockReturnValue("dummy content");
    vi.mocked(utils.hashString).mockReturnValue("hash123");
    vi.mocked(db.getLastFailedEval).mockReturnValue(null);
    vi.mocked(db.saveEval).mockImplementation(() => {});

    vi.mocked(utils.generateWithSelfHealing).mockResolvedValue({
      implementationAmbiguity: { score: 2, feedback: "bad" },
      architectureConstraints: { score: 2, feedback: "bad" },
      backwardCompatibility: { score: 2, feedback: "bad" },
      pass: false,
      overallFeedback: "looks bad",
    });

    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const processExitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation((() => {}) as any);

    await runEval(specs, {
      stage: false,
      nonInteractive: true,
      json: false,
      force: false,
      dryRun: false,
      stdin: false,
    });

    expect(processExitSpy).toHaveBeenCalledWith(1);

    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });
});
