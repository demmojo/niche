import { describe, it, expect } from "vitest";
import { resolveConfinedPath } from "../schema.js";
import path from "path";

describe("resolveConfinedPath", () => {
  it("should block directory traversal attacks", () => {
    expect(() => resolveConfinedPath("/tmp", "../etc/passwd")).toThrow();
  });

  it("should allow valid confined paths", () => {
    const p = resolveConfinedPath("/tmp", "payload.json");
    expect(p).toBe(path.join("/tmp", "payload.json"));
  });

  it("should resolve subdirectories", () => {
    const p = resolveConfinedPath("/tmp", "subdir/payload.json");
    expect(p).toBe(path.join("/tmp", "subdir/payload.json"));
  });
});
