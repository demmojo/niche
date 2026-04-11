import { describe, it, expect, vi } from "vitest";
import { TerminalPresenter, CloudLogPresenter, isHeadless } from "../../presenter.js";

const mockExit = vi.spyOn(process, "exit").mockImplementation((() => {}) as any);

describe("TerminalPresenter (Safe Exits)", () => {
  it("should safely drain stdout and stderr before exiting (JSON mode)", async () => {
    const presenter = new TerminalPresenter(true, true); // json mode
    const stdoutWriteSpy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation((str: any, cb: any) => {
        if (cb) cb();
        return true;
      });

    const stderrWriteSpy = vi
      .spyOn(process.stderr, "write")
      .mockImplementation((str: any, cb: any) => {
        if (cb) cb();
        return true;
      });

    await presenter.fail("Test failure");

    expect(stdoutWriteSpy).toHaveBeenCalled();
    expect(stderrWriteSpy).toHaveBeenCalled();

    // Check JSON structure
    const outputString = stdoutWriteSpy.mock.calls[0][0];
    const parsed = JSON.parse(outputString);
    expect(parsed.status).toBe("error");
    expect(parsed.message).toBe("Test failure");
  });

  it("should format success in JSON mode", async () => {
    const presenter = new TerminalPresenter(false, true);
    const stdoutWriteSpy = vi.spyOn(process.stdout, "write").mockImplementation((str: any, cb: any) => { if (cb) cb(); return true; });
    await presenter.success({ success: true });
    expect(stdoutWriteSpy).toHaveBeenCalledWith(expect.stringContaining('"status":"success"'), expect.any(Function));
  });

  it("should log humanMessage if provided in non-JSON mode", async () => {
    const presenter = new TerminalPresenter(false, false);
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await presenter.success({ success: true }, "Custom message");
    expect(consoleLogSpy).toHaveBeenCalledWith("✅ Custom message");
  });

  it("should route warn and error to console.error", () => {
    const presenter = new TerminalPresenter(false, false);
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    presenter.warn("warn message");
    expect(consoleErrorSpy).toHaveBeenCalledWith("warn message");
    presenter.error("error message");
    expect(consoleErrorSpy).toHaveBeenCalledWith("error message");
  });

  it("should output data instead of humanMessage if humanMessage is omitted (non-JSON mode)", async () => {
    const presenter = new TerminalPresenter(false, false);
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await presenter.success({ someData: 123 });
    expect(consoleLogSpy).toHaveBeenCalledWith({ someData: 123 });
  });

  it("should output suggestedCommand in non-JSON mode if provided", async () => {
    const presenter = new TerminalPresenter(false, false);
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await presenter.fail("Interactive failure", "error_code", "openspec do something");
    expect(consoleErrorSpy).toHaveBeenCalledWith("\nRun: openspec do something");
  });

  it("should catch and resolve if process.exit throws in safeExit", async () => {
    const presenter = new TerminalPresenter(false, false);
    mockExit.mockImplementationOnce(() => { throw new Error("simulated exit throw"); });
    
    vi.spyOn(process.stdout, "write").mockImplementation((str: any, cb: any) => {
      if (cb) cb();
      return true;
    });
    vi.spyOn(process.stderr, "write").mockImplementation((str: any, cb: any) => {
      if (cb) cb();
      return true;
    });

    await presenter.safeExit(0);
    // Should resolve without throwing
    expect(mockExit).toHaveBeenCalled();
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
  });
});

describe("CloudLogPresenter", () => {
  it("should log info messages as JSON with severity INFO", () => {
    const presenter = new CloudLogPresenter();
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    presenter.log("test log");
    expect(consoleLogSpy).toHaveBeenCalledWith(JSON.stringify({ severity: "INFO", message: "test log" }));
  });

  it("should log warn messages as JSON with severity WARNING", () => {
    const presenter = new CloudLogPresenter();
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    presenter.warn("test warn");
    expect(consoleErrorSpy).toHaveBeenCalledWith(JSON.stringify({ severity: "WARNING", message: "test warn" }));
  });

  it("should log error messages as JSON with severity ERROR", () => {
    const presenter = new CloudLogPresenter();
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    presenter.error("test error");
    expect(consoleErrorSpy).toHaveBeenCalledWith(JSON.stringify({ severity: "ERROR", message: "test error" }));
  });

  it("should exit safely on success", async () => {
    const presenter = new CloudLogPresenter();
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await presenter.success({ key: "val" }, "success msg");
    expect(consoleLogSpy).toHaveBeenCalledWith(JSON.stringify({ severity: "INFO", status: "success", message: "success msg", data: { key: "val" } }));
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it("should exit safely on fail", async () => {
    const presenter = new CloudLogPresenter();
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await presenter.fail(new Error("failure"), "err_code", "try this");
    expect(consoleErrorSpy).toHaveBeenCalledWith(JSON.stringify({ severity: "ERROR", status: "error", code: "err_code", message: "failure", suggestedCommand: "try this" }));
    expect(mockExit).toHaveBeenCalledWith(1);
  });
  it("should exit safely with jsonStdout on CloudLogPresenter", async () => {
    const presenter = new CloudLogPresenter();
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await presenter.safeExit(0, "  json payload  \n");
    expect(consoleLogSpy).toHaveBeenCalledWith("json payload");
    expect(mockExit).toHaveBeenCalledWith(0);
  });
});

describe("isHeadless", () => {
  it("should return true if process.stdout.isTTY is false", () => {
    const originalIsTTY = process.stdout.isTTY;
    process.stdout.isTTY = false;
    expect(isHeadless()).toBe(true);
    process.stdout.isTTY = originalIsTTY;
  });

  it("should return true if process.env.CI is true", () => {
    const originalIsTTY = process.stdout.isTTY;
    const originalCI = process.env.CI;
    process.stdout.isTTY = true;
    process.env.CI = "true";
    expect(isHeadless()).toBe(true);
    process.stdout.isTTY = originalIsTTY;
    process.env.CI = originalCI;
  });

  it("should return true if process.env.NON_INTERACTIVE is true", () => {
    const originalIsTTY = process.stdout.isTTY;
    const originalCI = process.env.CI;
    const originalNI = process.env.NON_INTERACTIVE;
    process.stdout.isTTY = true;
    delete process.env.CI;
    process.env.NON_INTERACTIVE = "true";
    expect(isHeadless()).toBe(true);
    process.stdout.isTTY = originalIsTTY;
    process.env.CI = originalCI;
    process.env.NON_INTERACTIVE = originalNI;
  });

  it("should return true if process.env.NO_COLOR is true", () => {
    const originalIsTTY = process.stdout.isTTY;
    const originalCI = process.env.CI;
    const originalNI = process.env.NON_INTERACTIVE;
    const originalNC = process.env.NO_COLOR;
    process.stdout.isTTY = true;
    delete process.env.CI;
    delete process.env.NON_INTERACTIVE;
    process.env.NO_COLOR = "true";
    expect(isHeadless()).toBe(true);
    process.stdout.isTTY = originalIsTTY;
    process.env.CI = originalCI;
    process.env.NON_INTERACTIVE = originalNI;
    process.env.NO_COLOR = originalNC;
  });

  it("should return false if all checks pass", () => {
    const originalIsTTY = process.stdout.isTTY;
    const originalCI = process.env.CI;
    const originalNI = process.env.NON_INTERACTIVE;
    const originalNC = process.env.NO_COLOR;
    process.stdout.isTTY = true;
    delete process.env.CI;
    delete process.env.NON_INTERACTIVE;
    delete process.env.NO_COLOR;
    expect(isHeadless()).toBe(false);
    process.stdout.isTTY = originalIsTTY;
    process.env.CI = originalCI;
    process.env.NON_INTERACTIVE = originalNI;
    process.env.NO_COLOR = originalNC;
  });
});
