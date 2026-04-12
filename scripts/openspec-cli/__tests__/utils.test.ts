import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushStreamsAndExit } from "../utils.js";

describe("flushStreamsAndExit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should wait for streams to drain", async () => {
    let drainCallback: any;
    vi.spyOn(process.stdout, "once").mockImplementation((event, cb) => {
      if (event === "drain") {
        drainCallback = cb;
      }
      return process.stdout;
    });

    vi.spyOn(process.stderr, "once").mockImplementation((event, cb) => {
      if (event === "drain") {
        cb(); // auto resolve stderr
      }
      return process.stderr;
    });

    // Property writableNeedDrain requires mocking differently or we can just mock process.stdout.write
    Object.defineProperty(process.stdout, "writableNeedDrain", {
      get: vi.fn().mockReturnValue(true),
      configurable: true,
    });
    Object.defineProperty(process.stderr, "writableNeedDrain", {
      get: vi.fn().mockReturnValue(false),
      configurable: true,
    });

    let resolved = false;
    const promise = flushStreamsAndExit(42).then(() => {
      resolved = true;
    });

    // Wait a tick
    await new Promise((r) => setTimeout(r, 10));
    expect(resolved).toBe(false);

    // Trigger the drain manually
    if (drainCallback) {
      drainCallback();
    }

    await promise;

    expect(process.exitCode).toBe(42);
  });
});
