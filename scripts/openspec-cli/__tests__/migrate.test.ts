import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as child_process from "child_process";
import { migrateLegacySpecs } from "../migrate.js";

vi.mock("fs");
vi.mock("child_process");

describe("Migrate Legacy Specs", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should fail if git tree is dirty and not forced", async () => {
    vi.mocked(child_process.execSync).mockReturnValue(" M some/file.ts\n");
    const presenterSpy = {
      fail: vi.fn(),
      success: vi.fn(),
    };
    vi.doMock("../presenter.js", () => ({
      TerminalPresenter: vi.fn().mockImplementation(() => presenterSpy),
      isHeadless: () => true,
    }));

    const { migrateLegacySpecs: migratedAgain } = await import("../migrate.js");
    await migratedAgain({
      nonInteractive: true,
      json: false,
      force: false,
    } as any);

    expect(presenterSpy.fail).toHaveBeenCalledWith(
      expect.stringContaining("Git tree is dirty"),
    );
  });

  it("should migrate valid legacy specs and skip active ones", async () => {
    vi.mocked(child_process.execSync).mockReturnValue(""); // Clean git tree
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readdirSync).mockReturnValue([
      "legacy-feature",
      "active-feature",
    ] as any);
    vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true } as any);

    // Mock file content
    vi.mocked(fs.readFileSync).mockImplementation((filePath: any) => {
      if (filePath.includes("legacy-feature")) {
        return `status: archived\ncreated_at: '2026-04-05T00:00:00.000Z'\nlearnings_extracted: true\n`;
      }
      if (filePath.includes("active-feature")) {
        return `status: in_progress\ncreated_at: '2026-04-06T00:00:00.000Z'\n`;
      }
      return "";
    });

    const presenterSpy = {
      fail: vi.fn(),
      success: vi.fn(),
    };
    vi.doMock("../presenter.js", () => ({
      TerminalPresenter: vi.fn().mockImplementation(() => presenterSpy),
      isHeadless: () => true,
    }));

    const { migrateLegacySpecs: migratedAgain } = await import("../migrate.js");
    await migratedAgain({
      nonInteractive: true,
      json: false,
      force: false,
    } as any);

    expect(fs.writeFileSync).toHaveBeenCalled();
    const writeCalls = vi.mocked(fs.writeFileSync).mock.calls;

    // Should only write for the legacy-feature (1 per baseDir * 3 baseDirs = 3 writes total, but mock returns same for all)
    // The migrated data should contain `schema: spec-driven`
    expect(writeCalls.length).toBe(3); // Called 3 times because we loop over 3 base dirs and readdirSync returns ["legacy-feature", "active-feature"] for each.
    expect(writeCalls[0][1]).toContain("schema: spec-driven");
    expect(writeCalls[0][1]).toContain("created: '2026-04-05'");
    expect(writeCalls[0][1]).toContain("status: archived");

    expect(presenterSpy.success).toHaveBeenCalledWith(
      { migratedCount: 3, skippedCount: 3 },
      expect.stringContaining("Successfully migrated 3"),
    );
  });
});
