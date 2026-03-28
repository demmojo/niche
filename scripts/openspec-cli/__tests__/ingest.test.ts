import { describe, it, expect, vi, beforeEach } from "vitest";
import { ingestPlan } from "../ingest.js";
import * as fs from "fs";
import * as path from "path";
import * as utils from "../utils.js";
import * as collision from "../collision.js";

vi.mock("fs");
vi.mock("../utils.js", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    generateWithSelfHealing: vi.fn(),
    getAllSpecs: vi.fn(),
  };
});
vi.mock("../collision.js", () => ({
  checkCollisions: vi.fn().mockResolvedValue(undefined),
}));

// Mock GoogleGenAI class to instantiate without error
vi.mock("@google/genai", () => ({
  GoogleGenAI: class MockGenAI {},
}));

describe("ingestPlan", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("GEMINI_API_KEY", "test-key");
  });

  it("should throw an error if plan file is missing", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);

    await expect(ingestPlan("missing.md")).rejects.toThrow(
      "Plan file not found",
    );
  });

  it("should throw an error if GEMINI_API_KEY is not set", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.mocked(fs.existsSync).mockReturnValue(true);

    await expect(ingestPlan("plan.md")).rejects.toThrow(
      "GEMINI_API_KEY is not set",
    );
  });

  it("should ingest successfully and scaffold the directory", async () => {
    // Setup file checks
    vi.mocked(fs.existsSync).mockImplementation((checkPath: any) => {
      // First, it checks if the plan file exists -> true
      if (checkPath === "plan.md") return true;
      // Then it checks if the target directory already exists -> false
      if (checkPath.includes("openspec/changes/test-feature")) return false;
      return false;
    });

    vi.mocked(fs.readFileSync).mockReturnValue(
      "This is a plan about test-feature",
    );

    vi.mocked(utils.generateWithSelfHealing).mockResolvedValue({
      featureName: "test-feature",
      proposal: "# Proposal",
      design: "# Design",
      spec: "# Spec",
      tasks: "# Tasks",
      depends_on: ["feature-a"],
    });

    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await ingestPlan("plan.md");

    expect(fs.mkdirSync).toHaveBeenCalledWith(
      expect.stringContaining(
        "openspec/changes/test-feature/specs/test-feature",
      ),
      expect.objectContaining({ recursive: true }),
    );
    expect(fs.writeFileSync).toHaveBeenCalledTimes(5); // .openspec.yaml, proposal, design, spec, tasks
    expect(collision.checkCollisions).toHaveBeenCalled();
    expect(fs.renameSync).toHaveBeenCalled(); // archives the plan

    consoleLogSpy.mockRestore();
  });

  it("should throw an error if target directory already exists", async () => {
    vi.mocked(fs.existsSync).mockImplementation((checkPath: any) => {
      if (checkPath === "plan.md") return true;
      if (checkPath.includes("openspec/changes/test-feature")) return true; // Pretend it exists
      return false;
    });

    vi.mocked(fs.readFileSync).mockReturnValue(
      "This is a plan about test-feature",
    );

    vi.mocked(utils.generateWithSelfHealing).mockResolvedValue({
      featureName: "test-feature",
      proposal: "# Proposal",
      design: "# Design",
      spec: "# Spec",
      tasks: "# Tasks",
      depends_on: ["feature-a"],
    });

    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const processExitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation((code: any) => {
        throw new Error("process.exit");
      });

    await expect(ingestPlan("plan.md")).rejects.toThrow();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Feature directory already exists"),
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);

    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });
});
