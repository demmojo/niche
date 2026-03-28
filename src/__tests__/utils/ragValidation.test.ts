import { describe, it, expect } from "vitest";
import { validateVerbatimQuote } from "../../utils/ragValidation";

describe("ragValidation", () => {
  describe("validateVerbatimQuote", () => {
    it("matches exact strings (strict)", () => {
      const source =
        "This is a simple verbatim quote to test the strict match.";
      const quote = "simple verbatim quote";
      const result = validateVerbatimQuote(quote, source);

      expect(result.isValid).toBe(true);
      expect(result.matchTier).toBe("strict");
    });

    it("matches with normalized text (normalized)", () => {
      const source = "This   is a    simple \n verbatim quote.";
      const quote = "simple verbatim quote";
      const result = validateVerbatimQuote(quote, source);

      expect(result.isValid).toBe(true);
      expect(result.matchTier).toBe("normalized");
    });

    it("matches with minor typos using fuzzy matching (fuzzy)", () => {
      const source = "This is a simple verbatim qzote with a typo.";
      const quote = "simple verbatim quote";
      const result = validateVerbatimQuote(quote, source);

      expect(result.isValid).toBe(true);
      expect(result.matchTier).toBe("fuzzy");
    });

    it("returns none for non-matching strings", () => {
      const source = "This string has completely different content.";
      const quote = "simple verbatim quote";
      const result = validateVerbatimQuote(quote, source);

      expect(result.isValid).toBe(false);
      expect(result.matchTier).toBe("none");
    });

    it("returns none if quote is too short and not exact", () => {
      const source = "The cat is here.";
      const quote = "dat"; // short, fuzzy matching disabled for length <= 10
      const result = validateVerbatimQuote(quote, source);

      expect(result.isValid).toBe(false);
      expect(result.matchTier).toBe("none");
    });

    it("matches short quotes exactly if they exist (strict)", () => {
      const source = "The cat is here.";
      const quote = "cat";
      const result = validateVerbatimQuote(quote, source);

      expect(result.isValid).toBe(true);
      expect(result.matchTier).toBe("strict");
    });
  });
});
