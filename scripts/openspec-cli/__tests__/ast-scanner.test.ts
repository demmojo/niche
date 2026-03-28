import { describe, it, expect, vi, beforeEach } from "vitest";
import { getStagedASTDiff, formatDiffForLLM } from "../ast-scanner.js";
import * as child_process from "child_process";

vi.mock("child_process");

describe("ast-scanner", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns empty array if git diff throws", () => {
    vi.mocked(child_process.execSync).mockImplementation(() => {
      throw new Error("git fail");
    });
    const result = getStagedASTDiff();
    expect(result).toEqual([]);
  });

  it("skips file if reading new content throws", () => {
    vi.mocked(child_process.execSync).mockImplementation((cmd) => {
      const command = cmd.toString();
      if (command.includes("git diff --cached")) {
        return Buffer.from("src/bad.ts");
      }
      if (command.includes("git show HEAD:src/bad.ts")) {
        return Buffer.from("");
      }
      if (command.includes("git show :src/bad.ts")) {
        throw new Error("git show fail");
      }
      return Buffer.from("");
    });
    const result = getStagedASTDiff();
    expect(result).toEqual([]);
  });

  it("getStagedASTDiff returns empty array when no files are staged", () => {
    vi.mocked(child_process.execSync).mockReturnValue(Buffer.from(""));
    const result = getStagedASTDiff();
    expect(result).toEqual([]);
  });

  it("getStagedASTDiff extracts added, removed, and modified signatures", () => {
    vi.mocked(child_process.execSync).mockImplementation((cmd) => {
      const command = cmd.toString();
      if (command.includes("git diff --cached --name-only")) {
        return Buffer.from(
          "src/components/MyComponent.tsx\nsrc/utils/helpers.ts",
        );
      }
      if (command.includes("git show HEAD:src/components/MyComponent.tsx")) {
        return Buffer.from(`
          export const MyComponent = ({ id }: { id: string }) => <div>Old</div>;
          export function RemovedFunction() {}
          export function ChangeReturn(): number { return 1; }
        `);
      }
      if (command.includes("git show :src/components/MyComponent.tsx")) {
        return Buffer.from(`
          export const MyComponent = ({ id, name }: { id: string, name: string }) => <div>New</div>;
          export function AddedFunction(x: number) {}
          export function ChangeReturn(): string { return "1"; }
        `);
      }
      if (command.includes("git show HEAD:src/utils/helpers.ts")) {
        throw new Error("Not found in HEAD"); // simulate new file
      }
      if (command.includes("git show :src/utils/helpers.ts")) {
        return Buffer.from(`export const useNewHook = () => {};`);
      }
      return Buffer.from("");
    });

    const result = getStagedASTDiff();

    expect(result).toHaveLength(2);

    const compDiff = result.find(
      (d) => d.filePath === "src/components/MyComponent.tsx",
    )!;
    expect(compDiff).toBeDefined();

    // Check Added
    expect(compDiff.added).toHaveLength(1);
    expect(compDiff.added[0].name).toBe("AddedFunction");
    expect(compDiff.added[0].type).toBe("Function");
    expect(compDiff.added[0].propsOrArgs).toContain("x: number");

    // Check Removed
    expect(compDiff.removed).toHaveLength(1);
    expect(compDiff.removed[0].name).toBe("RemovedFunction");

    // Check Modified
    expect(compDiff.modified).toHaveLength(2);
    expect(compDiff.modified[0].old.name).toBe("ChangeReturn");
    expect(compDiff.modified[0].new.returnType).toBe("string");
    expect(compDiff.modified[0].old.returnType).toBe("number");

    expect(compDiff.modified[1].old.name).toBe("MyComponent");
    expect(compDiff.modified[1].new.name).toBe("MyComponent");
    expect(compDiff.modified[1].new.propsOrArgs).not.toEqual(
      compDiff.modified[1].old.propsOrArgs,
    );

    // Check second file (new file)
    const hookDiff = result.find((d) => d.filePath === "src/utils/helpers.ts")!;
    expect(hookDiff.added).toHaveLength(1);
    expect(hookDiff.added[0].name).toBe("useNewHook");
    expect(hookDiff.added[0].type).toBe("Hook");
  });

  it("formatDiffForLLM formats correctly", () => {
    const diffs = [
      {
        filePath: "test.ts",
        added: [
          {
            name: "addFn",
            type: "Function",
            propsOrArgs: ["a"],
            returnType: "void",
            isExported: true,
          },
        ],
        removed: [
          {
            name: "remFn",
            type: "Hook",
            propsOrArgs: [],
            returnType: "any",
            isExported: false,
          },
        ],
        modified: [
          {
            old: {
              name: "modFn",
              type: "Component",
              propsOrArgs: ["oldProps"],
              returnType: "any",
              isExported: true,
            },
            new: {
              name: "modFn",
              type: "Component",
              propsOrArgs: ["newProps"],
              returnType: "any",
              isExported: true,
            },
          },
        ],
      },
    ];

    const result = formatDiffForLLM(diffs as any);
    expect(result).toContain("File: test.ts");
    expect(result).toContain("[ADDED] Function addFn(a) -> void");
    expect(result).toContain("[REMOVED] Hook remFn");
    expect(result).toContain(
      "[MODIFIED] Component modFn: Props changed from (oldProps) to (newProps)",
    );
  });
});
