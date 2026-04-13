import { describe, it, expect } from "vitest";
import {
  urlTransformAllowlist,
  getRehypeSanitizeSchema,
} from "../../lib/sanitization";
import rehypeSanitize from "rehype-sanitize";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";

describe("urlTransformAllowlist", () => {
  it("should allow http and https protocols", () => {
    expect(urlTransformAllowlist("https://example.com")).toBe(
      "https://example.com",
    );
    expect(urlTransformAllowlist("http://example.com")).toBe(
      "http://example.com",
    );
  });

  it("should allow mailto protocol", () => {
    expect(urlTransformAllowlist("mailto:test@example.com")).toBe(
      "mailto:test@example.com",
    );
  });

  it("should block javascript protocol", () => {
    expect(urlTransformAllowlist("javascript:alert(1)")).toBe("");
    expect(urlTransformAllowlist("JaVaScRiPt:alert(1)")).toBe("");
    expect(urlTransformAllowlist(" javascript:alert(1)")).toBe("");
  });

  it("should block data and blob protocols", () => {
    expect(
      urlTransformAllowlist(
        "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
      ),
    ).toBe("");
    expect(urlTransformAllowlist("blob:https://example.com/1234")).toBe("");
  });

  it("should block vbscript protocol", () => {
    expect(urlTransformAllowlist("vbscript:msgbox(1)")).toBe("");
  });

  it("should allow relative paths", () => {
    expect(urlTransformAllowlist("/images/logo.png")).toBe("/images/logo.png");
    expect(urlTransformAllowlist("#section")).toBe("#section");
  });
});

describe("getRehypeSanitizeSchema", () => {
  const sanitize = async (markdown: string) => {
    const file = await unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(rehypeSanitize, getRehypeSanitizeSchema())
      .use(rehypeStringify)
      .process(markdown);
    return String(file);
  };

  it("should block dangerous HTML nodes", async () => {
    const malicious =
      'Hello <script>alert(1)</script><iframe src="bad.html"></iframe><object data="bad.swf"></object>';
    const result = await sanitize(malicious);
    expect(result).not.toContain("<script>");
    expect(result).not.toContain("<iframe>");
    expect(result).not.toContain("<object>");
    expect(result).toContain("Hello ");
  });

  it("should allow standard markdown elements", async () => {
    const safe = "# Heading\n**Bold**\n[Link](https://example.com)";
    const result = await sanitize(safe);
    expect(result).toContain("<h1>Heading</h1>");
    expect(result).toContain("<strong>Bold</strong>");
    expect(result).toContain('<a href="https://example.com">Link</a>');
  });
});
