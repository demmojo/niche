import { describe, it, expect, vi, beforeEach } from "vitest";
import child_process from "child_process";
import { runBackgroundGC } from "../gc.js";

vi.mock("child_process", () => ({
  default: {
    spawn: vi.fn().mockReturnValue({
      unref: vi.fn(),
    }),
  },
}));

describe("runBackgroundGC", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should spawn a detached background process for GC", () => {
    runBackgroundGC();

    expect(child_process.spawn).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Array),
      expect.objectContaining({
        detached: true,
        stdio: "ignore",
      }),
    );
  });
});
