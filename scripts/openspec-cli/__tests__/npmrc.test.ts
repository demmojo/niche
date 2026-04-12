import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import { provisionNpmrc } from "../npm.js";
import path from "path";

vi.mock("fs", () => ({
  default: {
    writeFileSync: vi.fn(),
  },
}));

describe("provisionNpmrc", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should provision .npmrc with 0600 permissions", () => {
    process.env.NPM_TOKEN = "secret";
    provisionNpmrc("/tmp/staging");

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      "/tmp/staging/.npmrc",
      expect.stringContaining("secret"),
      expect.objectContaining({ mode: 0o600 }),
    );
  });
});
