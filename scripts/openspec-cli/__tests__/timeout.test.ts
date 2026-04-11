import { describe, it, expect, vi } from "vitest";
import { generateWithSelfHealing } from "../utils.js";
import { z } from "zod";

describe("ML Pipeline Safety", () => {
  it("should timeout long-running ML fetches via AbortSignal", async () => {
    // Mock AI client that never resolves
    const mockAi: any = {
      models: {
        generateContent: vi.fn().mockImplementation(() => {
          return new Promise((resolve) => setTimeout(resolve, 10000));
        }),
      },
    };

    const promise = generateWithSelfHealing(
      mockAi,
      "gemini-test",
      "test",
      z.object({}),
      undefined,
      1,
      100, // 100ms timeout
    );

    await expect(promise).rejects.toThrow(/timeout/i);
  });
});
