import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TerminalPresenter } from "../../presenter";

describe("TerminalPresenter (Safe Exits)", () => {
  let stdoutWriteSpy: any;
  let stderrWriteSpy: any;
  let exitSpy: any;

  beforeEach(() => {
    // Stub stdout/stderr writes to instantly call the callback
    stdoutWriteSpy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation((str: any, cb?: any) => {
        if (typeof cb === "function") cb();
        return true;
      });
    stderrWriteSpy = vi
      .spyOn(process.stderr, "write")
      .mockImplementation((str: any, cb?: any) => {
        if (typeof cb === "function") cb();
        return true;
      });
    exitSpy = vi.spyOn(process, "exit").mockImplementation((code: any) => {
      throw new Error(`process.exit called with ${code}`); // Prevent actual exit
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should safely drain stdout and stderr before exiting (JSON mode)", async () => {
    const presenter = new TerminalPresenter(true, true); // json mode

    await presenter.fail("Test failure");

    expect(stdoutWriteSpy).toHaveBeenCalled();
    expect(stderrWriteSpy).toHaveBeenCalled();

    // Check JSON structure
    const outputString = stdoutWriteSpy.mock.calls[0][0];
    const parsed = JSON.parse(outputString);
    expect(parsed.status).toBe("error");
    expect(parsed.message).toBe("Test failure");
  });

  it("should log to console.error but not stdout in non-JSON mode", async () => {
    const presenter = new TerminalPresenter(false, false); // interactive mode
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await presenter.fail("Interactive failure");

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Interactive failure"),
    );
    // Interactive mode shouldn't dump JSON to stdout on fail
    expect(stdoutWriteSpy).toHaveBeenCalledWith("", expect.any(Function));
    expect(stderrWriteSpy).toHaveBeenCalled(); // via our safe exit
  });
});
