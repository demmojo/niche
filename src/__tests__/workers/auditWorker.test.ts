import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const generateContentMock = vi.fn();
vi.mock("@google/genai", () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: generateContentMock,
      },
    })),
  };
});

const queryMock = vi.fn();
vi.mock("@google-cloud/bigquery", () => {
  return {
    BigQuery: vi.fn().mockImplementation(() => ({
      query: queryMock,
    })),
  };
});

describe("auditWorker", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    queryMock.mockResolvedValue([[]]); // mock BQ anomalies result by default
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should throw error if GEMINI_API_KEY is missing", async () => {
    vi.stubEnv("GCP_PROJECT_ID", "test");
    vi.stubEnv("GEMINI_API_KEY", "");
    const { processAuditWorker } =
      await import("../../../src/server/workers/auditWorker");

    await expect(processAuditWorker([])).rejects.toThrow(
      "GEMINI_API_KEY missing",
    );
  });

  it("should sample appropriately based on confidence scores", async () => {
    vi.stubEnv("GCP_PROJECT_ID", "test");
    vi.stubEnv("GEMINI_API_KEY", "test-key");

    const extractions = Array.from({ length: 200 }, (_, i) => ({
      name: `Record ${i}`,
      domain: `rec${i}.com`,
      confidenceScore: i < 100 ? 0.5 : 0.95,
    }));

    generateContentMock.mockResolvedValue({
      text: '{"passedAudit": true, "penaltyScore": 10}',
    });

    const { processAuditWorker } =
      await import("../../../src/server/workers/auditWorker");

    const result = await processAuditWorker(extractions);

    expect(result).toHaveLength(2);
    expect(result[0].confidenceScore).toBeLessThan(0.7);
    expect(result[1].confidenceScore).toBeGreaterThanOrEqual(0.9);
    expect(generateContentMock).toHaveBeenCalledTimes(2);
  });

  it("should quarantine records that fail audit", async () => {
    vi.stubEnv("GCP_PROJECT_ID", "test");
    vi.stubEnv("GEMINI_API_KEY", "test-key");

    const extractions = [
      { name: "Bad Record", confidenceScore: 0.4, domain: "bad.com" },
      { name: "Good Record", confidenceScore: 0.99, domain: "good.com" },
      ...Array.from({ length: 998 }, () => ({
        name: "Filler",
        confidenceScore: 0.5,
      })),
    ];

    generateContentMock
      .mockResolvedValueOnce({
        text: '{"passedAudit": false, "penaltyScore": 80}',
      })
      .mockResolvedValueOnce({
        text: '{"passedAudit": true, "penaltyScore": 0}',
      });

    const { logger } = await import("../../../src/server/logger");
    const loggerWarnSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});
    const { processAuditWorker } =
      await import("../../../src/server/workers/auditWorker");

    const result = await processAuditWorker(extractions);

    expect(
      result.some((r) => r.domain === "bad.com" && r.quarantined === true),
    ).toBe(true);
    expect(
      result.some(
        (r) => r.domain === "good.com" && r.quarantined === undefined,
      ),
    ).toBe(true);
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      "Audit failed for record Bad Record. Penalty: 80",
    );

    loggerWarnSpy.mockRestore();
  });

  it("should handle LLM throwing gracefully", async () => {
    vi.stubEnv("GCP_PROJECT_ID", "test");
    vi.stubEnv("GEMINI_API_KEY", "test-key");

    const extractions = [
      { name: "Error Record", confidenceScore: 0.4, domain: "err.com" },
      { name: "Good Record", confidenceScore: 0.99, domain: "good.com" },
      ...Array.from({ length: 998 }, () => ({
        name: "Filler",
        confidenceScore: 0.5,
      })),
    ];

    generateContentMock.mockRejectedValueOnce(new Error("Network Error"));
    const { logger } = await import("../../../src/server/logger");
    const loggerErrorSpy = vi
      .spyOn(logger, "error")
      .mockImplementation(() => {});
    const { processAuditWorker } =
      await import("../../../src/server/workers/auditWorker");

    const result = await processAuditWorker(extractions);

    expect(result.length).toBeGreaterThan(0);
    expect(loggerErrorSpy).toHaveBeenCalled();
    loggerErrorSpy.mockRestore();
  });

  it("should correctly handle markdown fences and empty JSON gracefully", async () => {
    vi.stubEnv("GCP_PROJECT_ID", "test");
    vi.stubEnv("GEMINI_API_KEY", "test-key");

    const extractions = [
      { name: "Markdown Record", confidenceScore: 0.4, domain: "md.com" },
      { name: "Empty Record", confidenceScore: 0.4, domain: "empty.com" },
      { name: "Good Record", confidenceScore: 0.99, domain: "good.com" },
      ...Array.from({ length: 997 }, () => ({
        name: "Filler",
        confidenceScore: 0.5,
      })),
    ];

    generateContentMock
      .mockResolvedValueOnce({
        text: '```json\n{"passedAudit": true, "penaltyScore": 10}\n```',
      })
      .mockResolvedValueOnce({
        text: "{}", // Missing passedAudit should fail strict check
      });

    const { logger } = await import("../../../src/server/logger");
    const loggerWarnSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});
    const { processAuditWorker } =
      await import("../../../src/server/workers/auditWorker");

    const result = await processAuditWorker(extractions);

    expect(
      result.some((r) => r.domain === "md.com" && r.quarantined === undefined),
    ).toBe(true); // Markdown parsed successfully
    expect(
      result.some((r) => r.domain === "empty.com" && r.quarantined === true),
    ).toBe(true); // {} fails closed
    loggerWarnSpy.mockRestore();
  });
});
