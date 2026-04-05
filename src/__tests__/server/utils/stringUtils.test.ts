import { describe, it, expect } from "vitest";
import { truncateContext } from "../../../server/utils/stringUtils";

describe("truncateContext", () => {
  it("should return the exact string if length is less than max", () => {
    expect(truncateContext("hello world", 4000)).toBe("hello world");
  });

  it("should return exactly max characters if length exceeds max", () => {
    const longString = "A".repeat(5000);
    const result = truncateContext(longString, 4000);
    expect(result.length).toBe(4000);
    expect(result).toBe("A".repeat(4000));
  });

  it("should slice safely in the middle of a word or JSON payload", () => {
    const jsonString = '{"key":"value"}';
    const result = truncateContext(jsonString, 8);
    expect(result).toBe('{"key":"');
    expect(result.length).toBe(8);
  });
});
