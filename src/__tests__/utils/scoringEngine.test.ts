import { describe, it, expect, bench } from "vitest";
import {
  calculateTarpitScore,
  calculateSquaredOrthogonalDistance,
  fastL2NormalizeInPlace,
  validateExaUrl,
  mergeVectors,
  calculateCosineSimilarity,
} from "../../utils/scoringEngine";

describe("scoringEngine", () => {
  describe("calculateTarpitScore", () => {
    it("returns 0 score (blue ocean) for 0 competitors and 1.0 uniqueness", () => {
      const result = calculateTarpitScore({
        apolloCount: 0,
        vectorUniqueness: 1.0,
      });
      expect(result.status).toBe("success");
      expect(result.score).toBe(0);
      expect(result.isTarpit).toBe(false);
    });

    it("returns high score for 100 competitors and 0 uniqueness", () => {
      const result = calculateTarpitScore({
        apolloCount: 100,
        vectorUniqueness: 0.0,
      });
      expect(result.status).toBe("success");
      expect(result.score).toBeGreaterThan(80);
      expect(result.isTarpit).toBe(true);
    });

    it("returns partial_data status when apolloCount is null", () => {
      const result = calculateTarpitScore({
        apolloCount: null,
        vectorUniqueness: 0.5,
      });
      expect(result.status).toBe("partial_data");
      expect(result.error).toBe("Apollo API unavailable");
    });

    it("caps saturation at 1.0 for 10,000 competitors", () => {
      const result = calculateTarpitScore({
        apolloCount: 10000,
        vectorUniqueness: 0.0,
      });
      expect(result.status).toBe("success");
      expect(result.saturationFactor).toBe(1.0);
      expect(result.score).toBe(100);
    });

    it("handles negative competitors by clamping to 0", () => {
      const result = calculateTarpitScore({
        apolloCount: -5,
        vectorUniqueness: 1.0,
      });
      expect(result.status).toBe("success");
      expect(result.saturationFactor).toBe(0);
      expect(result.score).toBe(0);
    });

    it("handles vectorUniqueness out of bounds", () => {
      const result = calculateTarpitScore({
        apolloCount: 0,
        vectorUniqueness: 1.5,
      });
      expect(result.status).toBe("success");
      expect(result.uniqueness).toBe(1.0);
    });
  });

  describe("calculateSquaredOrthogonalDistance", () => {
    it("calculates the correct squared orthogonal distance", () => {
      const v1 = new Float32Array([1, 0, 0]);
      const v2 = new Float32Array([0, 1, 0]);

      const distanceSq = calculateSquaredOrthogonalDistance(v1, v2);
      // v1 and v2 are orthogonal, so cosine similarity is 0.
      // Squared orthogonal distance is 1 - 0 = 1.
      expect(distanceSq).toBeCloseTo(1);
    });
  });

  describe("fastL2NormalizeInPlace", () => {
    it("normalizes a vector", () => {
      const v = new Float32Array([3, 4]); // length 5
      fastL2NormalizeInPlace(v);
      expect(v[0]).toBeCloseTo(0.6);
      expect(v[1]).toBeCloseTo(0.8);
    });

    it("handles zero vector without NaN", () => {
      const v = new Float32Array([0, 0]);
      fastL2NormalizeInPlace(v);
      expect(v[0]).toBe(0);
      expect(v[1]).toBe(0);
    });
  });

  describe("validateExaUrl", () => {
    it("allows http and https", () => {
      expect(validateExaUrl("https://example.com")).toBe(true);
      expect(validateExaUrl("http://example.com")).toBe(true);
    });

    it("rejects javascript: and data: URIs", () => {
      expect(validateExaUrl("javascript:alert(1)")).toBe(false);
      expect(validateExaUrl("data:text/html,<script>alert(1)</script>")).toBe(
        false,
      );
    });
  });

  describe("mergeVectors", () => {
    it("merges and l2-normalizes two vectors correctly", () => {
      const v1 = new Float32Array(768);
      v1[0] = 1;
      const v2 = new Float32Array(768);
      v2[1] = 1;

      const merged = mergeVectors([v1, v2]);

      // Expected: [0.707, 0.707, 0, ...]
      expect(merged[0]).toBeCloseTo(0.7071);
      expect(merged[1]).toBeCloseTo(0.7071);
      expect(merged[2]).toBe(0);
    });

    it("safeguards against zero vectors", () => {
      const v1 = new Float32Array(768);
      v1[0] = 1;
      const v2 = new Float32Array(768);
      v2[0] = -1; // Exact opposite, resulting sum is 0

      const merged = mergeVectors([v1, v2]);

      // Should be zero vector without NaN
      expect(merged[0]).toBe(0);
      expect(merged[1]).toBe(0);
    });

    it("enforces 768D constraint", () => {
      const v1 = new Float32Array(1536);
      expect(() => mergeVectors([v1])).toThrow(/768D/);
    });

    it("returns zero vector if array is empty (line 125)", () => {
      const merged = mergeVectors([]);
      expect(merged.length).toBe(768);
      expect(merged[0]).toBe(0);
    });
  });

  describe("validateExaUrl", () => {
    it("returns false for falsy urls (line 143)", () => {
      expect(validateExaUrl("")).toBe(false);
      // @ts-ignore
      expect(validateExaUrl(null)).toBe(false);
      // @ts-ignore
      expect(validateExaUrl(undefined)).toBe(false);
    });

    it("returns false for javascript: and data: urls", () => {
      expect(validateExaUrl("javascript:alert(1)")).toBe(false);
      expect(validateExaUrl("data:text/html,<html>")).toBe(false);
    });

    it("returns true for http and https urls", () => {
      expect(validateExaUrl("http://example.com")).toBe(true);
      expect(validateExaUrl("https://example.com")).toBe(true);
    });

    it("returns false for other protocols", () => {
      expect(validateExaUrl("ftp://example.com")).toBe(false);
    });
  });

  describe("getTaxonomyThresholds", () => {
    it("returns correct thresholds for known model", async () => {
      const { getTaxonomyThresholds } =
        await import("../../utils/scoringEngine");
      const t = getTaxonomyThresholds("gemini-embedding-001");
      expect(t.objective).toBe(0.85);
      expect(t.subjective).toBe(0.6);
    });

    it("returns default thresholds for unknown model", async () => {
      const { getTaxonomyThresholds } =
        await import("../../utils/scoringEngine");
      const t = getTaxonomyThresholds("unknown-model");
      expect(t.objective).toBe(0.85);
      expect(t.subjective).toBe(0.6);
    });
  });

  describe("calculateCosineSimilarity", () => {
    it("calculates cosine similarity correctly", () => {
      const v1 = new Float32Array([1, 0, 0]);
      const v2 = new Float32Array([0, 1, 0]);
      expect(calculateCosineSimilarity(v1, v2)).toBeCloseTo(0);
    });

    it("returns 1 when vectors are identical (TC-VEC-01)", () => {
      const v3 = new Float32Array([1, 0, 0]);
      const v4 = new Float32Array([1, 0, 0]);
      expect(calculateCosineSimilarity(v3, v4)).toBeCloseTo(1);
    });

    it("gracefully prevents divide-by-zero errors for zero-magnitude vectors (TC-VEC-02)", () => {
      const vZero = new Float32Array([0, 0, 0]);
      const v1 = new Float32Array([1, 0, 0]);
      expect(calculateCosineSimilarity(vZero, v1)).toBe(0);
      expect(calculateCosineSimilarity(vZero, vZero)).toBe(0);
    });

    it("gracefully rejects arrays with asymmetric lengths (TC-VEC-03)", () => {
      const v1 = new Float32Array([1, 0, 0]);
      const v2 = new Float32Array([1, 0]);
      expect(() => calculateCosineSimilarity(v1, v2)).toThrow(/mismatch/i);
    });
  });
});
