import { describe, it, expect } from "vitest";
import { calculateBinomialPValue } from "../../utils/mathUtils";

describe("calculateBinomialPValue", () => {
  it("calculates correct p-value for n=10, k=9, p=0.5", () => {
    // 9 successes out of 10 trials, chance is 0.5.
    // Probability of 9 or 10 successes is ~0.0107
    const pValue = calculateBinomialPValue(10, 9, 0.5);
    expect(pValue).toBeCloseTo(0.0107, 3);
  });

  it("calculates correct p-value for n=100, k=60, p=0.5", () => {
    const pValue = calculateBinomialPValue(100, 60, 0.5);
    expect(pValue).toBeCloseTo(0.0284, 3); // 1-tailed test
  });

  it("returns 1 for 0 successes", () => {
    expect(calculateBinomialPValue(10, 0, 0.5)).toBe(1);
  });

  it("returns small p for all successes", () => {
    expect(calculateBinomialPValue(10, 10, 0.5)).toBeCloseTo(0.000976, 4);
  });
});
