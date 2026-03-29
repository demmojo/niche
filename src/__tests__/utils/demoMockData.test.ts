import { describe, it, expect } from "vitest";
import * as demoMockData from "../../utils/demoMockData";

describe("demoMockData", () => {
  it("should export mock data objects and arrays", () => {
    expect(demoMockData).toBeDefined();
    Object.values(demoMockData).forEach((val) => {
      expect(val).toBeDefined();
    });
  });
});
