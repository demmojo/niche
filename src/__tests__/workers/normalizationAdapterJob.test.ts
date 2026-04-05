import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const saveMock = vi.fn().mockResolvedValue(true);
const fileMock = vi.fn(() => ({ save: saveMock }));
const bucketMock = vi.fn(() => ({ file: fileMock }));

vi.mock("@google-cloud/storage", () => {
  return { Storage: vi.fn(() => ({ bucket: bucketMock })) };
});

const generateContentMock = vi.fn();
const batchCreateMock = vi.fn().mockResolvedValue(true);
const batchListMock = vi.fn().mockResolvedValue({ batches: [] });
vi.mock("@google/genai", () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: generateContentMock,
      },
      batches: {
        create: batchCreateMock,
        list: batchListMock,
      },
    })),
  };
});

describe("normalizationAdapterJob", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should throw if LAKE_BUCKET_NAME is not set", async () => {
    vi.stubEnv("LAKE_BUCKET_NAME", "");
    await expect(
      import("../../../src/server/workers/normalizationAdapterJob"),
    ).rejects.toThrow("LAKE_BUCKET_NAME environment variable is required");
  });

  it("should throw error if tasks exceed 10000", async () => {
    vi.stubEnv("LAKE_BUCKET_NAME", "test-bucket");
    const { processNormalizationAdapterJob } =
      await import("../../../src/server/workers/normalizationAdapterJob");
    await expect(processNormalizationAdapterJob(1, 10001)).rejects.toThrow(
      "Normalization Adapter bounded to max 10,000 tasks per execution.",
    );
  });

  it("should warn and return early if GEMINI_API_KEY missing", async () => {
    vi.stubEnv("LAKE_BUCKET_NAME", "test-bucket");
    vi.stubEnv("GEMINI_API_KEY", "");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { processNormalizationAdapterJob } =
      await import("../../../src/server/workers/normalizationAdapterJob");

    const result = await processNormalizationAdapterJob(1, 100);
    expect(result).toBeUndefined();
    expect(consoleSpy).toHaveBeenCalledWith("GEMINI_API_KEY missing");
    consoleSpy.mockRestore();
  });

  it("should submit batch job", async () => {
    vi.stubEnv("LAKE_BUCKET_NAME", "test-bucket");
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const { processNormalizationAdapterJob } =
      await import("../../../src/server/workers/normalizationAdapterJob");

    // Pass mock partitionTime for deterministic testing
    const result = await processNormalizationAdapterJob(
      123,
      100,
      [],
      "competitor",
      "2026-04-05",
    );

    expect(bucketMock).toHaveBeenCalledWith("test-bucket");
    expect(fileMock).toHaveBeenCalledWith(
      "batch-inputs/type=competitor/partition=2026-04-05/task-123-part-0.jsonl",
    );
    expect(saveMock).toHaveBeenCalled();
    expect(result).toEqual({
      success: true,
      batchJobKeys: [
        "batch-inputs/type=competitor/partition=2026-04-05/task-123-part-0.jsonl",
      ],
    });

    consoleLogSpy.mockRestore();
  });
});
