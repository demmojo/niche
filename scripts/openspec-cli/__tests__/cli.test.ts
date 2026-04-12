import { describe, it, expect } from "vitest";
import { parseFlags } from "../schema.js";

describe("parseFlags", () => {
  it("should parse boolean string", () => {
    const flags = parseFlags(["--format=v2", "--ci=true"]);
    expect(flags.format).toBe("v2");
    expect(flags.ci).toBe(true);
  });

  it("should reject unknown flags with strict schema", () => {
    expect(() => parseFlags(["--unknown=yes"])).toThrow();
  });
});
