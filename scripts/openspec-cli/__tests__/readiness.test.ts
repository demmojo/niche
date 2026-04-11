import { describe, it, expect, vi } from "vitest";
import { checkReadiness } from "../readiness.js";
import { ParsedSpec } from "../utils.js";

describe("checkReadiness", () => {
  it("should return true if no dependencies exist", () => {
    const specs: ParsedSpec[] = [
      {
        id: "feature-a",
        dirPath: "",
        yamlPath: "",
        data: {
          status: "draft",
        },
      },
    ];

    // checkReadiness uses process.exit and console.error, so we need to mock console and prevent exit
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const result = checkReadiness(specs, "feature-a");
    expect(result).toBe(true);
  });

  it("should return true if dependencies are fulfilled", () => {
    const specs: ParsedSpec[] = [
      {
        id: "feature-a",
        dirPath: "",
        yamlPath: "",
        data: {
          status: "draft",
          depends_on: ["feature-b"],
        },
      },
      {
        id: "feature-b",
        dirPath: "",
        yamlPath: "",
        data: {
          status: "implemented",
        },
      },
    ];

    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const result = checkReadiness(specs, "feature-a");
    expect(result).toBe(true);
  });

  it("should return false if dependencies are unfulfilled", () => {
    const specs: ParsedSpec[] = [
      {
        id: "feature-a",
        dirPath: "",
        yamlPath: "",
        data: {
          status: "draft",
          depends_on: ["feature-b"],
        },
      },
      {
        id: "feature-b",
        dirPath: "",
        yamlPath: "",
        data: {
          status: "draft",
        },
      },
    ];

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const result = checkReadiness(specs, "feature-a");
    expect(result).toBe(false);
  });

  it("should return false if dependency is missing", () => {
    const specs: ParsedSpec[] = [
      {
        id: "feature-a",
        dirPath: "",
        yamlPath: "",
        data: {
          status: "draft",
          depends_on: ["feature-b"],
        },
      },
    ];

    const consoleWarnSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const result = checkReadiness(specs, "feature-a");

    expect(consoleWarnSpy).toHaveBeenCalled();
    expect(result).toBe(false);

    consoleWarnSpy.mockRestore();
  });

  it("should handle reverse dependencies (blocks)", () => {
    const specs: ParsedSpec[] = [
      {
        id: "feature-a",
        dirPath: "",
        yamlPath: "",
        data: {
          status: "draft",
        },
      },
      {
        id: "feature-b",
        dirPath: "",
        yamlPath: "",
        data: {
          status: "draft",
          blocks: ["feature-a"],
        },
      },
    ];

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const result = checkReadiness(specs, "feature-a");

    expect(result).toBe(false);
  });
});
