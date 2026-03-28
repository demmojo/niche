import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateDocs } from "../generate-docs.js";
import * as fs from "fs";
import * as utils from "../utils.js";
import * as child_process from "child_process";

vi.mock("fs");
vi.mock("child_process");
vi.mock("../utils.js", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    getAllSpecs: vi.fn(),
    generateWithSelfHealing: vi.fn(),
  };
});

describe("generateDocs", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should throw an error if the template file does not exist", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);

    await expect(generateDocs()).rejects.toThrow("Template not found");
  });

  it("should generate docs with basic formatting if no GEMINI_API_KEY", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");

    vi.mocked(fs.existsSync).mockImplementation((pathStr) => {
      if (typeof pathStr === "string" && pathStr.includes("README.template.md"))
        return true;
      if (typeof pathStr === "string" && pathStr.includes("proposal.md"))
        return true;
      return false;
    });

    vi.mocked(fs.readFileSync).mockImplementation((pathStr) => {
      if (
        typeof pathStr === "string" &&
        pathStr.includes("README.template.md")
      ) {
        return "<!-- OPENSPEC_TABLE_START --><!-- OPENSPEC_TABLE_END -->\n<!-- GIT_HISTORY_START --><!-- GIT_HISTORY_END -->";
      }
      if (typeof pathStr === "string" && pathStr.includes("proposal.md")) {
        return "## What Changes\nThis is a cool feature.";
      }
      return "";
    });

    vi.mocked(utils.getAllSpecs).mockReturnValue([
      {
        id: "feature-a",
        dirPath: "openspec/changes/feature-a",
        yamlPath: "openspec/changes/feature-a/.openspec.yaml",
        data: { status: "draft" },
      },
    ]);

    vi.mocked(child_process.execSync).mockReturnValue(
      Buffer.from("* initial commit (1234567) - 2026-03-27"),
    );

    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const fsWriteFileSyncSpy = vi.mocked(fs.writeFileSync);

    await generateDocs();

    expect(fsWriteFileSyncSpy).toHaveBeenCalled();
    const writeContent = fsWriteFileSyncSpy.mock.calls[0][1] as string;

    expect(writeContent).toContain("<!-- OPENSPEC_TABLE_START -->");
    expect(writeContent).toContain(
      "| feature-a | Derived from proposal | draft | [feature-a](openspec/changes/feature-a) |",
    );
    expect(writeContent).toContain("<!-- GIT_HISTORY_START -->");
    expect(writeContent).toContain("* initial commit (1234567) - 2026-03-27");

    consoleLogSpy.mockRestore();
  });
});
