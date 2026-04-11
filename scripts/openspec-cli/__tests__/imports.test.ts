import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { globSync } from "glob";

describe("CLI Performance & Memory Safety", () => {
  it("should not contain static imports for @google/genai to prevent V8 memory bloat", () => {
    const cliFiles = globSync("scripts/openspec-cli/**/*.ts", {
      ignore: ["**/__tests__/**"],
    });

    const staticImportRegex = /^import\s+(?!type\s+).*@google\/genai/m;

    const violatingFiles: string[] = [];

    for (const file of cliFiles) {
      const content = fs.readFileSync(file, "utf-8");
      if (staticImportRegex.test(content)) {
        violatingFiles.push(file);
      }
    }

    expect(violatingFiles).toEqual([]);
  });
});
