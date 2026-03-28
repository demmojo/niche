import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildContext } from "../context.js";
import * as fs from "fs";
import * as collision from "../collision.js";

vi.mock("fs");
vi.mock("../collision.js", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    getCache: vi.fn(),
    saveCache: vi.fn(),
    hashText: vi.fn(),
    cosineSimilarity: vi.fn(),
  };
});

vi.mock("@google/genai", () => ({
  GoogleGenAI: class MockGenAI {
    models = {
      embedContent: vi.fn().mockResolvedValue({
        embeddings: [{ values: [0.1, 0.2, 0.3] }],
      }),
    };
  },
}));

describe("buildContext", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.mocked(fs.readFileSync).mockReturnValue("dummy file content");
    vi.mocked(collision.getCache).mockReturnValue({});
    vi.mocked(collision.hashText).mockReturnValue("hash123");
    vi.mocked(collision.cosineSimilarity).mockReturnValue(0.9);
  });

  it("should throw an error if the target spec is not found", async () => {
    const specs = [
      {
        id: "feature-b",
        dirPath: "openspec/changes/feature-b",
        yamlPath: "",
        data: { status: "draft" },
      },
    ];

    await expect(buildContext("feature-a", specs as any)).rejects.toThrow(
      "Spec 'feature-a' not found",
    );
  });

  it("should generate context including target, deps, blocks, and retrieved specs (with API key)", async () => {
    const specs = [
      {
        id: "feature-a",
        dirPath: "openspec/changes/feature-a",
        yamlPath: "",
        data: {
          status: "draft",
          depends_on: ["feature-b"],
          blocks: ["feature-c"],
        },
      },
      {
        id: "feature-b",
        dirPath: "openspec/changes/feature-b",
        yamlPath: "",
        data: { status: "implemented" },
      }, // dependency
      {
        id: "feature-c",
        dirPath: "openspec/changes/feature-c",
        yamlPath: "",
        data: { status: "proposed" },
      }, // blocked
      {
        id: "feature-d",
        dirPath: "openspec/changes/feature-d",
        yamlPath: "",
        data: { status: "draft" },
      }, // community context
    ];

    const result = await buildContext("feature-a", specs as any);

    expect(result).toContain("# Context for OpenSpec: feature-a");
    expect(result).toContain("## Target Specification");
    expect(result).toContain("<target_spec>");
    expect(result).toContain("Spec: feature-a");

    expect(result).toContain("## Direct Dependencies (Full Text)");
    expect(result).toContain("<dependencies>");
    expect(result).toContain("Spec: feature-b");

    expect(result).toContain("## Blocked Downstream Specs (Full Text)");
    expect(result).toContain("<blocked_specs>");
    expect(result).toContain("Spec: feature-c");

    expect(result).toContain("## Global DAG Community");
    expect(result).toContain("<retrieved_context>");
    expect(result).toContain("feature-d"); // Mock similarity gives a high score
  });

  it("should fallback to global summaries if no API key", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");

    const specs = [
      {
        id: "feature-a",
        dirPath: "openspec/changes/feature-a",
        yamlPath: "",
        data: { status: "draft" },
      },
      {
        id: "feature-d",
        dirPath: "openspec/changes/feature-d",
        yamlPath: "",
        data: { status: "draft" },
      },
    ];

    const result = await buildContext("feature-a", specs as any);

    expect(result).toContain("<global_summaries>");
    expect(result).toContain("- **feature-d**");
    expect(result).not.toContain("<retrieved_context>");
  });

  it("should exclude superseded and archived specs from global community context", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const specs = [
      {
        id: "feature-a",
        dirPath: "openspec/changes/feature-a",
        yamlPath: "",
        data: { status: "draft" },
      },
      {
        id: "feature-d",
        dirPath: "openspec/changes/feature-d",
        yamlPath: "",
        data: { status: "superseded" },
      },
      {
        id: "feature-e",
        dirPath: "openspec/changes/feature-e",
        yamlPath: "",
        data: { status: "archived" },
      },
    ];

    const result = await buildContext("feature-a", specs as any);

    expect(result).not.toContain("- **feature-d**");
    expect(result).not.toContain("- **feature-e**");
  });
});
