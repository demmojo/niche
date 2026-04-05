import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { calculateImageHash } from "../../utils/hashWorkerAPI";

describe("calculateImageHash", () => {
  let MockWorker: any;
  let workerInstance: any;

  beforeEach(() => {
    workerInstance = {
      postMessage: vi.fn(),
      terminate: vi.fn(),
      onmessage: null as any,
      onerror: null as any,
    };

    MockWorker = vi.fn(() => workerInstance);
    vi.stubGlobal("Worker", MockWorker);

    vi.stubGlobal(
      "createImageBitmap",
      vi.fn().mockResolvedValue("mocked-bitmap"),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should return the hash on success", async () => {
    const file = new File(["test"], "test.png", { type: "image/png" });

    workerInstance.postMessage.mockImplementation(() => {
      setTimeout(() => {
        if (workerInstance.onmessage) {
          workerInstance.onmessage({
            data: { type: "success", hash: "test-hash" },
          });
        }
      }, 0);
    });

    const result = await calculateImageHash(file);
    expect(result).toBe("test-hash");
    expect(workerInstance.terminate).toHaveBeenCalled();
    expect(MockWorker).toHaveBeenCalledWith(
      expect.any(URL),
      expect.objectContaining({ type: "module" }),
    );
    expect(workerInstance.postMessage).toHaveBeenCalledWith("mocked-bitmap", [
      "mocked-bitmap",
    ]);
  });

  it("should reject on worker error message", async () => {
    const file = new File(["test"], "test.png", { type: "image/png" });

    workerInstance.postMessage.mockImplementation(() => {
      setTimeout(() => {
        if (workerInstance.onmessage) {
          workerInstance.onmessage({
            data: { type: "error", error: "Worker failed" },
          });
        }
      }, 0);
    });

    await expect(calculateImageHash(file)).rejects.toThrow("Worker failed");
    expect(workerInstance.terminate).toHaveBeenCalled();
  });

  it("should reject on worker error event", async () => {
    const file = new File(["test"], "test.png", { type: "image/png" });

    workerInstance.postMessage.mockImplementation(() => {
      setTimeout(() => {
        if (workerInstance.onerror) {
          workerInstance.onerror(new Error("Network error"));
        }
      }, 0);
    });

    await expect(calculateImageHash(file)).rejects.toThrow("Network error");
    expect(workerInstance.terminate).toHaveBeenCalled();
  });

  it("should reject if createImageBitmap fails", async () => {
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn().mockRejectedValue(new Error("Invalid image")),
    );

    const file = new File(["test"], "test.png", { type: "image/png" });

    await expect(calculateImageHash(file)).rejects.toThrow("Invalid image");
    expect(workerInstance.terminate).toHaveBeenCalled();
    expect(workerInstance.postMessage).not.toHaveBeenCalled();
  });
});
