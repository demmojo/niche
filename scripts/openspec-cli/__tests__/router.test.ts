import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import { emitPayload, logDiagnostic } from "../presenter.js";
import path from "path";

vi.mock("fs", () => ({
  default: {
    writeFileSync: vi.fn(),
    mkdtempSync: vi.fn().mockReturnValue("/tmp/openspec-123"),
  },
}));

describe("StdioRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should route diagnostics to stderr", () => {
    const mockStderr = vi
      .spyOn(process.stderr, "write")
      .mockImplementation(() => true);
    logDiagnostic("test message");
    expect(mockStderr).toHaveBeenCalledWith(
      expect.stringContaining("test message"),
    );
  });

  it("should dump >100KB payload to disk and emit reference to stdout", () => {
    const mockStdout = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);

    // Create payload > 100KB
    const largeData = "a".repeat(101 * 1024);
    emitPayload({ data: largeData }, { dumpDir: "/tmp" });

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("payload-"),
      expect.stringContaining(largeData),
      expect.objectContaining({ flag: "wx", mode: 0o600 }),
    );

    const stdoutCall = mockStdout.mock.calls[0][0] as string;
    const stdoutJson = JSON.parse(stdoutCall);
    expect(stdoutJson).toHaveProperty("payloadDumpPath");
    expect(stdoutJson.payloadDumpPath).toContain("payload-");
    expect(stdoutJson).not.toHaveProperty("data", largeData);
  });
});
