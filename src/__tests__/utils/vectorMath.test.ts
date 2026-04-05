import { describe, it, expect } from "vitest";
import { mergeVectors } from "../../utils/vectorMath";

describe("vectorMath", () => {
  it("should throw if no vectors provided", () => {
    expect(() => mergeVectors([])).toThrow("Must provide at least one vector");
  });

  it("should throw if dimension is not 768", () => {
    const shortVec = new Array(10).fill(1);
    expect(() => mergeVectors([shortVec])).toThrow(
      "Vectors must be exactly 768 dimensions",
    );
  });

  it("should throw if weights length does not match", () => {
    const vec1 = new Array(768).fill(1);
    const vec2 = new Array(768).fill(2);
    expect(() => mergeVectors([vec1, vec2], [1])).toThrow(
      "Weights array must match vectors array length",
    );
  });

  it("should throw if vectors have different dimensions", () => {
    const vec1 = new Array(768).fill(1);
    const vec2 = new Array(10).fill(2) as any;
    expect(() => mergeVectors([vec1, vec2])).toThrow(
      "All vectors must have the same dimensions",
    );
  });

  it("should calculate correctly without weights and normalize", () => {
    const vec1 = new Array(768).fill(0);
    vec1[0] = 1;
    const vec2 = new Array(768).fill(0);
    vec2[1] = 1;

    const merged = mergeVectors([vec1, vec2]);
    expect(merged[0]).toBeCloseTo(0.7071);
    expect(merged[1]).toBeCloseTo(0.7071);
    expect(merged[2]).toBe(0);
  });

  it("should calculate correctly with weights and normalize", () => {
    const vec1 = new Array(768).fill(0);
    vec1[0] = 1;
    const vec2 = new Array(768).fill(0);
    vec2[1] = 1;

    // vec1 weight 3, vec2 weight 4. Result magnitude = 5
    const merged = mergeVectors([vec1, vec2], [3, 4]);
    expect(merged[0]).toBeCloseTo(0.6); // 3/5
    expect(merged[1]).toBeCloseTo(0.8); // 4/5
    expect(merged[2]).toBe(0);
  });

  it("should handle zero-magnitude correctly", () => {
    const vec1 = new Array(768).fill(0);
    const vec2 = new Array(768).fill(0);

    const merged = mergeVectors([vec1, vec2]);
    expect(merged[0]).toBe(0);
    expect(merged[767]).toBe(0);
  });
});
