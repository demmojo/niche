import { describe, it, expect, vi } from "vitest";
import { checkCycles } from "../validate.js";
import { ParsedSpec } from "../utils.js";

describe("checkCycles", () => {
  it("should return true if there are no dependencies", () => {
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

    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const isValid = checkCycles(specs);
    expect(isValid).toBe(true);
  });

  it("should return true if there are no cycles in a complex graph", () => {
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
          depends_on: ["feature-c"],
        },
      },
      {
        id: "feature-c",
        dirPath: "",
        yamlPath: "",
        data: {
          status: "draft",
        },
      },
    ];

    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const isValid = checkCycles(specs);
    expect(isValid).toBe(true);
  });

  it("should return false if there is a cycle", () => {
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
          depends_on: ["feature-c"],
        },
      },
      {
        id: "feature-c",
        dirPath: "",
        yamlPath: "",
        data: {
          status: "draft",
          depends_on: ["feature-a"],
        },
      },
    ];

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const isValid = checkCycles(specs);
    expect(isValid).toBe(false);

    consoleLogSpy.mockRestore();
  });

  it("should return false if there is a cycle using blocks", () => {
    const specs: ParsedSpec[] = [
      {
        id: "feature-a",
        dirPath: "",
        yamlPath: "",
        data: {
          status: "draft",
          blocks: ["feature-b"],
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
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const isValid = checkCycles(specs);
    expect(isValid).toBe(false);

    consoleLogSpy.mockRestore();
  });

  it("should return false and log an error if there are dangling references in depends_on", () => {
    const specs: ParsedSpec[] = [
      {
        id: "feature-a",
        dirPath: "",
        yamlPath: "",
        data: {
          status: "draft",
          depends_on: ["non-existent-feature"],
        },
      },
    ];

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const isValid = checkCycles(specs);
    expect(isValid).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Dangling reference"),
    );

    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  it("should return false and log an error if there are dangling references in blocks", () => {
    const specs: ParsedSpec[] = [
      {
        id: "feature-a",
        dirPath: "",
        yamlPath: "",
        data: {
          status: "draft",
          blocks: ["non-existent-feature"],
        },
      },
    ];

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const isValid = checkCycles(specs);
    expect(isValid).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Dangling reference"),
    );

    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  it("should return true and skip already visited nodes in a diamond graph", () => {
    const specs: ParsedSpec[] = [
      {
        id: "feature-a",
        dirPath: "",
        yamlPath: "",
        data: {
          status: "draft",
          depends_on: ["feature-b", "feature-c"],
        },
      },
      {
        id: "feature-b",
        dirPath: "",
        yamlPath: "",
        data: {
          status: "draft",
          depends_on: ["feature-d"],
        },
      },
      {
        id: "feature-c",
        dirPath: "",
        yamlPath: "",
        data: {
          status: "draft",
          depends_on: ["feature-d"],
        },
      },
      {
        id: "feature-d",
        dirPath: "",
        yamlPath: "",
        data: {
          status: "draft",
        },
      },
    ];

    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const isValid = checkCycles(specs);
    expect(isValid).toBe(true);

    consoleSpy.mockRestore();
  });

  it("should return false if there is a self-referencing cycle", () => {
    const specs: ParsedSpec[] = [
      {
        id: "feature-a",
        dirPath: "",
        yamlPath: "",
        data: {
          status: "draft",
          depends_on: ["feature-a"],
        },
      },
    ];

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const isValid = checkCycles(specs);
    expect(isValid).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Cycle detected!"),
    );

    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });
});
