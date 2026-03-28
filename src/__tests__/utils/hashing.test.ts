import { describe, it, expect } from "vitest";
import {
  calculateExactHash,
  calculateSimHash,
  simHashDistance,
  generateEmbedding,
} from "../../utils/hashing";

describe("hashing utils", () => {
  describe("calculateExactHash", () => {
    it("calculates SHA-256 for a string", async () => {
      const hash = await calculateExactHash("test");
      expect(hash).toBe(
        "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
      );
    });

    it("calculates SHA-256 for an object", async () => {
      const hash1 = await calculateExactHash({ a: 1, b: 2 });
      const hash2 = await calculateExactHash(JSON.stringify({ a: 1, b: 2 }));
      expect(hash1).toBe(hash2);
    });
  });

  describe("calculateSimHash", () => {
    it("calculates a 32-bit hex simhash for text", () => {
      const hash = calculateSimHash("hello world this is a test");
      expect(typeof hash).toBe("string");
      expect(hash.length).toBeLessThanOrEqual(8);
    });

    it("similar texts have similar hashes", () => {
      const hash1 = calculateSimHash(
        "the quick brown fox jumps over the lazy dog",
      );
      const hash2 = calculateSimHash(
        "the quick brown fox jumps over the lazy cat",
      );
      const distance = simHashDistance(hash1, hash2);
      expect(distance).toBeLessThan(16); // Should be very close
    });

    it("handles empty or punctuation-only strings", () => {
      const hash1 = calculateSimHash("");
      const hash2 = calculateSimHash(".,!?");
      expect(hash1).toBe("00000000");
      expect(hash2).toBe("00000000");
    });
  });

  describe("simHashDistance", () => {
    it("calculates hamming distance between two hex strings", () => {
      // 00000000 vs 00000001 -> diff 1 bit
      expect(simHashDistance("00000000", "00000001")).toBe(1);
      // ffffffff vs 00000000 -> diff 32 bits
      expect(simHashDistance("ffffffff", "00000000")).toBe(32);
      // 0000000f (1111) vs 00000000 -> diff 4 bits
      expect(simHashDistance("0000000f", "00000000")).toBe(4);
    });
  });

  describe("generateEmbedding", () => {
    it("generates an array of numbers of length 1536", async () => {
      const embedding = await generateEmbedding("test");
      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding).toHaveLength(1536);
      expect(typeof embedding[0]).toBe("number");
    });
  });
});
