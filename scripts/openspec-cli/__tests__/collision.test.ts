import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  checkCollisions,
  hashText,
  cosineSimilarity,
  getCache,
  saveCache,
} from "../collision.js";
import * as fs from "fs";

vi.mock("fs");
vi.mock("@google/genai", () => ({
  GoogleGenAI: class MockGenAI {
    models = {
      embedContent: vi.fn().mockResolvedValue({
        embeddings: [{ values: [0.1, 0.2, 0.3] }],
      }),
    };
  },
}));

describe("collision", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("GEMINI_API_KEY", "test-key");
  });

  describe("hashText", () => {
    it("should generate a hash for a given text", () => {
      const hash1 = hashText("hello");
      const hash2 = hashText("world");
      expect(hash1).not.toBe(hash2);
      expect(hash1).toBe(hashText("hello"));
    });
  });

  describe("cosineSimilarity", () => {
    it("should compute similarity between vectors", () => {
      const v1 = [1, 0, 0];
      const v2 = [1, 0, 0];
      const v3 = [0, 1, 0];

      expect(cosineSimilarity(v1, v2)).toBeCloseTo(1.0);
      expect(cosineSimilarity(v1, v3)).toBeCloseTo(0.0);
    });

    it("should handle zero vectors", () => {
      expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
    });
  });

  describe("getCache & saveCache", () => {
    it("should return empty object if cache does not exist", () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      expect(getCache()).toEqual({});
    });

    it("should return parsed JSON if cache exists", () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(
        '{"test": {"hash": "abc", "vector": [1]}}',
      );

      expect(getCache()).toEqual({
        test: { hash: "abc", vector: [1] },
      });
    });

    it("should save cache as stringified JSON", () => {
      saveCache({ test: { hash: "abc", vector: [1] } });
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining(".openspec-gemini-embeddings.json"),
        expect.stringContaining('"hash": "abc"'),
      );
    });
  });

  describe("checkCollisions", () => {
    it("should skip if GEMINI_API_KEY is not set", async () => {
      vi.stubEnv("GEMINI_API_KEY", "");
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      await checkCollisions([]);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Skipping collision detection"),
      );

      consoleWarnSpy.mockRestore();
    });

    it("should not detect collision for single spec", async () => {
      const specs = [
        {
          id: "feature-a",
          dirPath: "openspec/changes/feature-a",
          yamlPath: "",
          data: { status: "draft" },
        },
      ];
      vi.mocked(fs.readFileSync).mockReturnValue("dummy proposal");
      vi.mocked(fs.existsSync).mockReturnValue(false); // No cache

      const consoleLogSpy = vi
        .spyOn(console, "log")
        .mockImplementation(() => {});
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      await checkCollisions(specs as any);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "No significant semantic collisions detected.",
      );
      expect(consoleWarnSpy).not.toHaveBeenCalled();

      consoleLogSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    it("should warn if there is a collision", async () => {
      const specs = [
        {
          id: "feature-a",
          dirPath: "openspec/changes/feature-a",
          yamlPath: "",
          data: { status: "draft" },
        },
        {
          id: "feature-b",
          dirPath: "openspec/changes/feature-b",
          yamlPath: "",
          data: { status: "draft" },
        },
      ];

      vi.mocked(fs.readFileSync).mockReturnValue("identical proposal content");
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      await checkCollisions(specs as any);

      // Both will get the identical mock embedding from the mock GoogleGenAI, so sim will be 1.0 > 0.85
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("COLLISION WARNING"),
      );

      consoleWarnSpy.mockRestore();
    });
  });
});
