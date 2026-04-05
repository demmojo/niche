import { describe, it, expect } from "vitest";
import { estimateTokens, middleTruncate } from "../../utils/ragContextUtils";

describe("ragContextUtils", () => {
  describe("estimateTokens", () => {
    it("should return 0 for empty string", () => {
      expect(estimateTokens("")).toBe(0);
    });

    it("should estimate tokens based on length / 4 (rounded up)", () => {
      expect(estimateTokens("1234")).toBe(1); // 4 / 4 = 1
      expect(estimateTokens("12345")).toBe(2); // 5 / 4 = 1.25 -> 2
      expect(estimateTokens("12345678")).toBe(2); // 8 / 4 = 2
      expect(estimateTokens("123456789")).toBe(3); // 9 / 4 = 2.25 -> 3
    });
  });

  describe("middleTruncate", () => {
    it("should return the original text if effectiveMaxTokens <= 0", () => {
      const text = "This is a very long text that shouldn't be touched.";
      expect(middleTruncate(text, 50, 100)).toBe(text); // 50 - 100 = -50
      expect(middleTruncate(text, 100, 100)).toBe(text); // 100 - 100 = 0
    });

    it("should return the original text if currentTokens <= effectiveMaxTokens", () => {
      const text = "12345678"; // 8 chars = 2 tokens
      // maxTokens = 102, safetyMargin = 100 => effectiveMaxTokens = 2
      // currentTokens (2) <= effectiveMaxTokens (2)
      expect(middleTruncate(text, 102, 100)).toBe(text);
    });

    it("should truncate the text in the middle when it exceeds effectiveMaxTokens", () => {
      // 40 chars = 10 tokens
      const text = "0123456789012345678901234567890123456789";

      // maxTokens = 106, safetyMargin = 100 => effectiveMaxTokens = 6
      // currentTokens = 10. We need to truncate.
      // effectiveMaxTokens = 6 => allowedChars = 24
      // charsToKeep = 24 - 15 = 9
      // halfChars = 4
      // start = text.slice(0, 4) = "0123"
      // end = text.slice(-4) = "6789"
      // result = "0123 [...] 6789"

      const result = middleTruncate(text, 106, 100);
      expect(result).toBe("0123 [...] 6789");
    });

    it("should use default safetyMargin of 100 if not provided", () => {
      // 500 chars = 125 tokens
      const text = "a".repeat(500);

      // maxTokens = 110. Default safetyMargin = 100 => effectiveMaxTokens = 10
      // currentTokens = 125. We need to truncate.
      // allowedChars = 40
      // charsToKeep = 25
      // halfChars = 12
      // start = 12 "a"s, end = 12 "a"s
      // result = "aaaaaaaaaaaa [...] aaaaaaaaaaaa"

      const result = middleTruncate(text, 110);
      expect(result).toBe("a".repeat(12) + " [...] " + "a".repeat(12));
    });

    it("should handle odd charsToKeep properly using Math.floor", () => {
      const text = "0123456789012345678901234567890123456789"; // 40 chars

      // maxTokens = 107, safetyMargin = 100 => effectiveMaxTokens = 7
      // allowedChars = 28
      // charsToKeep = 28 - 15 = 13
      // halfChars = Math.floor(13 / 2) = 6
      // result = 6 chars from start, 6 chars from end
      const result = middleTruncate(text, 107, 100);

      expect(result).toBe("012345 [...] 456789");
    });
  });
});
