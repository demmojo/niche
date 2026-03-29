import { describe, it, expect } from "vitest";
import { tMessage, dictionary } from "../../content/dictionary";

describe("dictionary", () => {
  it("tMessage returns the string casted as LocalizedString", () => {
    const msg = tMessage("Hello");
    expect(msg).toBe("Hello");
  });

  it("dictionary object has expected keys", () => {
    expect(dictionary).toBeDefined();
    expect(dictionary.tooltips).toBeDefined();
    expect(dictionary.common).toBeDefined();
    expect(dictionary.dashboard).toBeDefined();
    expect(dictionary.myProduct).toBeDefined();
  });
});
