import { describe, it, expect } from "vitest";
import {
  calculateBinomialPValue,
  Float32ArrayPool,
} from "../../utils/mathUtils";

describe("mathUtils", () => {
  describe("calculateBinomialPValue", () => {
    it("should calculate correct p-value for basic inputs", () => {
      // 10 trials, 8 successes, p=0.5 -> ~0.0546
      const p = calculateBinomialPValue(10, 8, 0.5);
      expect(p).toBeCloseTo(0.0546875, 4);
    });

    it("should handle edge cases", () => {
      expect(calculateBinomialPValue(0, 0)).toBe(1);
      expect(calculateBinomialPValue(10, -1)).toBe(1);
      expect(calculateBinomialPValue(10, 11)).toBe(1);
    });

    it("should calculate correctly for p != 0.5", () => {
      // 5 trials, 3 successes, p=0.2
      // P(X>=3) = P(3) + P(4) + P(5)
      // = 10*(0.2)^3*(0.8)^2 + 5*(0.2)^4*(0.8)^1 + 1*(0.2)^5
      // = 0.0512 + 0.0064 + 0.00032 = 0.05792
      const p = calculateBinomialPValue(5, 3, 0.2);
      expect(p).toBeCloseTo(0.05792, 4);
    });
  });

  describe("Float32ArrayPool", () => {
    it("should allocate new arrays when empty", () => {
      const pool = new Float32ArrayPool(10);
      const arr = pool.acquire();
      expect(arr).toBeInstanceOf(Float32Array);
      expect(arr.length).toBe(10);
    });

    it("should reuse released arrays and fill them with zeros", () => {
      const pool = new Float32ArrayPool(5);
      const arr1 = pool.acquire();
      arr1[0] = 42;

      pool.release(arr1);

      const arr2 = pool.acquire();
      expect(arr2).toBe(arr1); // Same reference
      expect(arr2[0]).toBe(0); // Should be zeroed out
    });

    it("should ignore releasing arrays of wrong size", () => {
      const pool = new Float32ArrayPool(5);
      const wrongSizeArr = new Float32Array(10);

      pool.release(wrongSizeArr);
      const arr = pool.acquire();

      expect(arr).not.toBe(wrongSizeArr);
      expect(arr.length).toBe(5);
    });
  });
});
