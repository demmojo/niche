import { describe, it, expect } from "vitest";
import { regexScrub } from "../../utils/piiScrubber";

describe("piiScrubber", () => {
  it("should handle empty strings", () => {
    expect(regexScrub("")).toBe("");
  });

  it("should scrub SSNs", () => {
    expect(regexScrub("My SSN is 123-45-6789.")).toBe("My SSN is [SSN].");
    expect(regexScrub("My SSN is 123.45.6789")).toBe("My SSN is [SSN]");
  });

  it("should scrub emails", () => {
    expect(regexScrub("Contact me at test@example.com for info.")).toBe(
      "Contact me at [EMAIL] for info.",
    );
  });

  it("should scrub phones", () => {
    expect(regexScrub("Call 555-123-4567 today.")).toBe("Call [PHONE] today.");
  });

  it("should scrub multiple types together", () => {
    expect(regexScrub("Email test@test.com or call 555-555-5555")).toBe(
      "Email [EMAIL] or call [PHONE]",
    );
  });
});
