import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { runDriftHealing } from "../drift.js";
import * as astScanner from "../ast-scanner.js";
import { promises as fs } from "fs";
import * as child_process from "child_process";
import path from "path";

vi.mock("../ast-scanner.js");
vi.mock("fs", () => ({
  promises: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
  },
}));
vi.mock("child_process");

let mockGenAIResponse = "{}";

/**
 * MockGenAI
 */
vi.mock("@google/genai", () => {
  return {
    /** Mocked GenAI class */
    GoogleGenAI: class MockGenAI {
      models = {
        /**
         *
         */
        generateContent: async () => {
          return {
            text: mockGenAIResponse,
          };
        },
      };
    },
  };
});

describe("drift", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    mockGenAIResponse = "{}";
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it("skips healing if no GEMINI_API_KEY", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    await runDriftHealing();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "Skipping drift healing: GEMINI_API_KEY is not set.",
    );
  });

  it("catches and warns on generic errors from fs", async () => {
    vi.mocked(astScanner.getStagedASTDiff).mockReturnValue([
      { filePath: "test.ts", added: [], removed: [], modified: [] } as any,
    ]);
    vi.mocked(astScanner.formatDiffForLLM).mockReturnValue("dummy diff");

    mockGenAIResponse = JSON.stringify({
      requiresUpdate: true,
      reason: "Tech debt found",
      techDebtTask: "- [ ] Refactor",
    });

    vi.mocked(fs.writeFile).mockImplementationOnce(() => {
      throw new Error("FS error");
    });

    await runDriftHealing();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "Warning: Failed to perform AST drift auto-healing",
      expect.any(Error),
    );
  });

  it("exits if no structural AST changes", async () => {
    vi.mocked(astScanner.getStagedASTDiff).mockReturnValue([]);
    await runDriftHealing();
    expect(consoleLogSpy).not.toHaveBeenCalledWith(
      "Analyzing structural AST changes for auto-healing documentation...",
    );
  });

  it("processes drift and writes tech debt when LLM flags requiresUpdate and returns a techDebtTask", async () => {
    vi.mocked(astScanner.getStagedASTDiff).mockReturnValue([
      { filePath: "test.ts", added: [], removed: [], modified: [] } as any,
    ]);
    vi.mocked(astScanner.formatDiffForLLM).mockReturnValue("dummy diff");

    mockGenAIResponse = JSON.stringify({
      requiresUpdate: true,
      reason: "Found some tech debt",
      techDebtTask: "- [ ] Refactor: fix the new component",
    });

    vi.mocked(fs.readFile).mockRejectedValue(new Error("not found"));
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    vi.mocked(child_process.execSync).mockReturnValue(Buffer.from(""));

    await runDriftHealing();

    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining("tech-debt.md"),
      expect.stringContaining("- [ ] Refactor: fix the new component"),
    );
    expect(child_process.execSync).toHaveBeenCalledWith(
      expect.stringContaining("git add"),
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      "✅ Healed documentation successfully staged for commit.",
    );
  });

  it("does not write anything if requiresUpdate is false", async () => {
    vi.mocked(astScanner.getStagedASTDiff).mockReturnValue([
      { filePath: "test.ts", added: [], removed: [], modified: [] } as any,
    ]);
    vi.mocked(astScanner.formatDiffForLLM).mockReturnValue("dummy diff");

    mockGenAIResponse = JSON.stringify({
      requiresUpdate: false,
      reason: "No updates needed",
    });

    await runDriftHealing();

    expect(fs.writeFile).not.toHaveBeenCalled();
    expect(child_process.execSync).not.toHaveBeenCalled();
  });
});
