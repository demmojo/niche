import { describe, it, expect, vi } from "vitest";
import { verifyStagingToken } from "../drift.js";
import crypto from "crypto";

describe("verifyStagingToken", () => {
  it("should reject invalid SHA-256 staging tokens", () => {
    const validToken = crypto
      .createHash("sha256")
      .update("test_content")
      .digest("hex");
    const result = verifyStagingToken("test_content", "invalid_token");
    expect(result).toBe(false);
  });

  it("should accept valid SHA-256 staging tokens", () => {
    const validToken = crypto
      .createHash("sha256")
      .update("test_content")
      .digest("hex");
    const result = verifyStagingToken("test_content", validToken);
    expect(result).toBe(true);
  });
});
