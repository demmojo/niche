import { describe, it, expect, vi, beforeEach } from "vitest";
import { setupEpipeHandler } from "../presenter.js";

describe("EPIPE handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should swallow EPIPE and trigger graceful shutdown", () => {
    const mockExit = vi
      .spyOn(process, "exit")
      .mockImplementation(() => undefined as never);
    setupEpipeHandler();

    // Emit EPIPE error
    const err = new Error("EPIPE");
    (err as any).code = "EPIPE";
    process.stdout.emit("error", err);

    expect(mockExit).toHaveBeenCalledWith(0);
  });
});
