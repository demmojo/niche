import { describe, it, expect } from "vitest";
import { CliOptionsSchema } from "../schema.js";

describe("CliOptionsSchema", () => {
  it("should coerce string values to booleans", () => {
    const parsed = CliOptionsSchema.parse({
      nonInteractive: "true",
      json: "false",
      force: "", // commander might do this
    });
    expect(parsed.nonInteractive).toBe(true);
    expect(parsed.json).toBe(false);
    expect(parsed.force).toBe(true);
  });

  it("should reject unknown flags via strict()", () => {
    expect(() => {
      CliOptionsSchema.parse({
        unknownFlag: true,
      });
    }).toThrow(/Unrecognized key/);
  });
});
