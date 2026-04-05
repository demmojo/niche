import { describe, it, expect, vi } from "vitest";
import { measureVariance } from "../../../utils/eval/statisticalRunner";

describe("statisticalRunner", () => {
  describe("measureVariance", () => {
    it("should correctly calculate mean, stdDev, and ci95", async () => {
      const executionFn = vi.fn().mockResolvedValue("output");
      let counter = 0;
      // Return scores: 2, 4, 4, 4, 5, 5, 7, 9
      const scores = [2, 4, 4, 4, 5, 5, 7, 9];
      const scoringFn = vi.fn().mockImplementation(() => {
        return scores[counter++];
      });

      const result = await measureVariance(
        executionFn,
        scoringFn,
        scores.length,
      );

      expect(executionFn).toHaveBeenCalledTimes(scores.length);
      expect(scoringFn).toHaveBeenCalledTimes(scores.length);

      expect(result.scores).toEqual(scores);
      expect(result.mean).toBe(5); // (2+4+4+4+5+5+7+9) / 8 = 40 / 8 = 5

      // Variance = ((2-5)^2 + 3*(4-5)^2 + 2*(5-5)^2 + (7-5)^2 + (9-5)^2) / 7
      // Variance = (9 + 3 + 0 + 4 + 16) / 7 = 32 / 7 = 4.5714...
      // stdDev = sqrt(32/7) = 2.1380899...
      expect(result.stdDev).toBeCloseTo(2.1380899, 4);

      // ci95 = 1.96 * (stdDev / sqrt(8)) = 1.96 * (2.1380899 / 2.828427) = 1.4815...
      expect(result.ci95).toBeCloseTo(1.4815, 3);
    });

    it("should handle single iteration gracefully", async () => {
      const executionFn = vi.fn().mockResolvedValue("output");
      const scoringFn = vi.fn().mockResolvedValue(10);

      const result = await measureVariance(executionFn, scoringFn, 1);

      expect(result.mean).toBe(10);
      expect(result.stdDev).toBe(0);
      expect(result.ci95).toBe(0);
      expect(result.scores).toEqual([10]);
    });

    it("should handle zero iterations by returning empty scores but avoiding NaN if possible (or gracefully handling)", async () => {
      const executionFn = vi.fn().mockResolvedValue("output");
      const scoringFn = vi.fn().mockResolvedValue(10);

      const result = await measureVariance(executionFn, scoringFn, 0);

      expect(result.mean).toBe(0);
      expect(result.stdDev).toBe(0);
      expect(result.ci95).toBeNaN(); // Since Math.sqrt(0) is 0, 1.96 * (0 / 0) = NaN
      expect(result.scores).toEqual([]);
    });
  });
});
