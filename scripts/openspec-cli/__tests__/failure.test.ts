import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import { handleFailure } from "../utils.js";

vi.mock("fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("fs")>();
  return {
    default: {
      ...actual,
      mkdirSync: vi.fn(),
      writeFileSync: vi.fn(),
    },
  };
});

describe("handleFailure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CI = "true";
  });

  it("should sanitize error and write to .openspec-failed-artifacts", () => {
    const error = new Error("Test error");
    (error as any).code = "ERR_TEST";
    (error as any).sensitiveToken = "secret";

    handleFailure(error, "test-uuid");

    expect(fs.mkdirSync).toHaveBeenCalledWith(
      ".openspec-failed-artifacts/test-uuid",
      { recursive: true },
    );
  });
});
