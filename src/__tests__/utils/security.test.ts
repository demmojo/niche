import { describe, it, expect } from "vitest";
import {
  sanitizeUserInput,
  sanitizeMarkdownFallback,
} from "../../utils/security";

describe("Security Utilities", () => {
  describe("sanitizeUserInput", () => {
    it("should strip < and > characters to prevent XML/prompt injection", () => {
      const input = "<user_input> Malicious content </user_input>";
      const expected = "user_input Malicious content /user_input";
      expect(sanitizeUserInput(input)).toBe(expected);
    });

    it("should return the original string if no control characters are present", () => {
      const input = "This is a safe string with 123 and !@#.";
      expect(sanitizeUserInput(input)).toBe(input);
    });

    it("should handle empty strings", () => {
      expect(sanitizeUserInput("")).toBe("");
    });

    it("should correctly handle strings with only < or >", () => {
      expect(sanitizeUserInput("<<<>>>")).toBe("");
      expect(sanitizeUserInput("a<b<c>d>e")).toBe("abcde");
    });
  });

  describe("sanitizeMarkdownFallback", () => {
    it("should convert clean markdown to HTML without stripping content", async () => {
      const markdown = "# Hello\n\nThis is **bold** text.";
      const html = await sanitizeMarkdownFallback(markdown);
      expect(html).toContain("<h1>Hello</h1>");
      expect(html).toContain("<strong>bold</strong>");
    });

    it("should strip malicious script tags via AST sanitization", async () => {
      const markdown = "# Hello\n\n<script>alert('XSS')</script>";
      const html = await sanitizeMarkdownFallback(markdown);
      expect(html).not.toContain("<script>");
      expect(html).not.toContain("alert");
    });

    it("should strip dangerous onclick attributes", async () => {
      const markdown = "[Click me](javascript:alert(1))";
      const html = await sanitizeMarkdownFallback(markdown);
      expect(html).not.toContain("javascript:");
    });
  });
});
