import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as path from "path";
import * as fs from "fs";
import { FsExecutor, FsIntent } from "../../fs-intents";
import { TerminalPresenter } from "../../presenter";

vi.mock("fs", async (importOriginal) => {
  const actual = (await importOriginal()) as any;
  return {
    ...actual,
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
    rmSync: vi.fn(),
    renameSync: vi.fn(),
  };
});

describe("FsExecutor (Sandbox Mirroring)", () => {
  let presenter: TerminalPresenter;
  const cwd = process.cwd();

  beforeEach(() => {
    presenter = new TerminalPresenter(true, true);
    vi.clearAllMocks();
  });

  it("should map absolute paths into the sandbox root correctly", () => {
    const sandboxRoot = path.join(cwd, ".tmp/openspec_test/root");
    const executor = new FsExecutor(false, presenter, sandboxRoot);

    vi.mocked(fs.existsSync).mockReturnValue(false);

    const intents: FsIntent[] = [
      {
        kind: "createFile",
        absolutePath: path.join(cwd, "src/test.ts"),
        content: "test",
      },
    ];

    executor.execute(intents);

    const expectedPath = path.join(sandboxRoot, "src/test.ts");
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expectedPath,
      "test",
      "utf-8",
    );
  });

  it("should prevent path traversal escaping the workspace", () => {
    const sandboxRoot = path.join(cwd, ".tmp/openspec_test/root");
    const executor = new FsExecutor(false, presenter, sandboxRoot);

    const maliciousPath = path.resolve(cwd, "../../../../etc/passwd");

    const intents: FsIntent[] = [
      { kind: "createFile", absolutePath: maliciousPath, content: "hacked" },
    ];

    expect(() => executor.execute(intents)).toThrow(/Sandbox escape attempt/);
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  it("should throw when attempting gitMove inside a staging sandbox", () => {
    const sandboxRoot = path.join(cwd, ".tmp/openspec_test/root");
    const executor = new FsExecutor(false, presenter, sandboxRoot);

    const intents: FsIntent[] = [
      {
        kind: "gitMove",
        oldPath: path.join(cwd, "a.ts"),
        newPath: path.join(cwd, "b.ts"),
      },
    ];

    expect(() => executor.execute(intents)).toThrow(
      /gitMove cannot be executed within a staging sandbox/,
    );
  });
});
