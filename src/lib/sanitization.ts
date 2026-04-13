import { defaultSchema } from "rehype-sanitize";

// urlTransform utilizing a strict allowlist approach
export function urlTransformAllowlist(url: string): string {
  if (!url) return "";

  const trimmed = url.trim();
  const lower = trimmed.toLowerCase();

  // Allow relative URLs or anchors
  if (lower.startsWith("/") || lower.startsWith("#") || lower.startsWith("?")) {
    return trimmed;
  }

  // Strict allowlist: http:, https:, mailto:
  if (
    lower.startsWith("http:") ||
    lower.startsWith("https:") ||
    lower.startsWith("mailto:")
  ) {
    return trimmed;
  }

  // Deny anything else (javascript:, vbscript:, data:, blob:, etc.)
  return "";
}

// Configures rehype-sanitize to explicitly filter dangerous HTML nodes
export function getRehypeSanitizeSchema() {
  // Use the default schema as a base (which is already quite safe)
  // but explicitly ensure these node types are stripped just in case.
  const schema = { ...defaultSchema };

  schema.tagNames = (schema.tagNames || []).filter(
    (tag) =>
      !["script", "iframe", "object", "embed", "svg", "math"].includes(tag),
  );

  return schema;
}
