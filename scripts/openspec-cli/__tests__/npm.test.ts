import { describe, it, expect, vi, beforeEach } from "vitest";
import child_process from "child_process";
import { hydrateDependencies } from "../npm.js";

vi.mock("child_process", () => ({
  default: {
    spawnSync: vi.fn().mockReturnValue({ status: 0 }),
  },
}));

describe("hydrateDependencies", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call npm ci with correct flags", () => {
    hydrateDependencies("/tmp/staging");

    expect(child_process.spawnSync).toHaveBeenCalledWith(
      "npm",
      ["ci", "--prefer-offline", "--no-audit", "--fund=false"],
      expect.objectContaining({
        cwd: "/tmp/staging",
        shell: false,
      }),
    );
  });
});
