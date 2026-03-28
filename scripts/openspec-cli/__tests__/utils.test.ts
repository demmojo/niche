import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateWithSelfHealing,
  truncateGitDiff,
  hashString,
  getAllSpecs,
} from "../utils.js";
import * as fs from "fs";
import { z } from "zod";

vi.mock("fs");

describe("utils", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("truncateGitDiff", () => {
    it("should truncate lines properly", () => {
      const lines = Array.from({ length: 600 }).map((_, i) => `Line ${i}`);
      const text = lines.join("\n");

      const truncated = truncateGitDiff(text, 500);
      const split = truncated.split("\n");

      expect(split.length).toBe(503); // 250 top + 1 truncation note + 250 bottom
      expect(truncated).toContain(
        "... [ 100 lines truncated from middle ] ...",
      );
      expect(split[0]).toBe("Line 0");
      expect(split[split.length - 1]).toBe("Line 599");
    });

    it("should not truncate if less than maxLines", () => {
      const text = Array.from({ length: 100 })
        .map((_, i) => `Line ${i}`)
        .join("\n");
      const truncated = truncateGitDiff(text, 500);
      expect(truncated).toBe(text);
    });
  });

  describe("hashString", () => {
    it("should hash a string", () => {
      const hash = hashString("hello");
      expect(hash).toBeDefined();
      expect(hash.length).toBe(64); // sha256 hex is 64 chars
    });
  });

  describe("generateWithSelfHealing", () => {
    const mockAI = {
      models: {
        generateContent: vi.fn(),
      },
    };
    const schema = z.object({
      success: z.boolean(),
    });

    it("should return valid data on first attempt", async () => {
      mockAI.models.generateContent.mockResolvedValueOnce({
        text: JSON.stringify({ success: true }),
      });

      const result = await generateWithSelfHealing(
        mockAI as any,
        "model",
        "prompt",
        schema,
      );
      expect(result.success).toBe(true);
      expect(mockAI.models.generateContent).toHaveBeenCalledTimes(1);
    });

    it("should retry on validation error and eventually succeed", async () => {
      // First attempt fails JSON parse
      mockAI.models.generateContent.mockResolvedValueOnce({
        text: "invalid json",
      });
      // Second attempt succeeds
      mockAI.models.generateContent.mockResolvedValueOnce({
        text: JSON.stringify({ success: true }),
      });

      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      const result = await generateWithSelfHealing(
        mockAI as any,
        "model",
        "prompt",
        schema,
      );

      expect(result.success).toBe(true);
      expect(mockAI.models.generateContent).toHaveBeenCalledTimes(2);
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it("should throw error after max retries", async () => {
      mockAI.models.generateContent.mockResolvedValue({
        text: "invalid json",
      });

      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      await expect(
        generateWithSelfHealing(
          mockAI as any,
          "model",
          "prompt",
          schema,
          undefined,
          2,
        ),
      ).rejects.toThrow();

      expect(mockAI.models.generateContent).toHaveBeenCalledTimes(2);

      consoleWarnSpy.mockRestore();
    });
  });

  describe("getAllSpecs", () => {
    it("should parse specs properly", () => {
      vi.mocked(fs.existsSync).mockImplementation((pathStr: any) => {
        if (pathStr === "openspec/changes") return true;
        if (pathStr === "openspec/changes/feature-a/.openspec.yaml")
          return true;
        return false;
      });

      vi.mocked(fs.readdirSync).mockImplementation((pathStr: any) => {
        if (pathStr === "openspec/changes") return ["feature-a"] as any;
        return [];
      });

      vi.mocked(fs.statSync).mockImplementation((pathStr: any) => {
        if (pathStr === "openspec/changes/feature-a")
          return {
            /**
             *
             */
            isDirectory: () => true,
          } as any;
        return {
          /**
           *
           */
          isDirectory: () => false,
        } as any;
      });

      vi.mocked(fs.readFileSync).mockImplementation(() => {
        return `
schema: spec-driven
status: draft
        `;
      });

      const specs = getAllSpecs(["openspec/changes"]);
      expect(specs.length).toBe(1);
      expect(specs[0].id).toBe("feature-a");
      expect(specs[0].data.status).toBe("draft");
    });

    it("should throw if yaml is invalid", () => {
      vi.mocked(fs.existsSync).mockImplementation((pathStr: any) => {
        if (pathStr === "openspec/changes") return true;
        if (pathStr === "openspec/changes/feature-a/.openspec.yaml")
          return true;
        return false;
      });

      vi.mocked(fs.readdirSync).mockImplementation(() => ["feature-a"] as any);
      vi.mocked(fs.statSync).mockImplementation(
        () =>
          ({
            /**
             *
             */
            isDirectory: () => true,
          }) as any,
      );
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        return `
schema: invalid
status: draft
        `;
      });

      expect(() => getAllSpecs(["openspec/changes"])).toThrow();
    });
  });
});
