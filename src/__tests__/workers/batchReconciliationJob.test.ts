import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { z } from "zod";
import { logger } from "../../../src/server/logger";

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

const saveMock = vi.fn().mockResolvedValue(true);
const fileMock = vi.fn(() => ({ save: saveMock }));
const bucketMock = vi.fn(() => ({ file: fileMock }));

vi.mock("@google-cloud/storage", () => {
  return { Storage: vi.fn(() => ({ bucket: bucketMock })) };
});

describe("batchReconciliationJob", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should throw if GEMINI_API_KEY is not set", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const { processBatchReconciliation } =
      await import("../../../src/server/workers/batchReconciliationJob");
    await expect(processBatchReconciliation([], z.any())).rejects.toThrow(
      "GEMINI_API_KEY missing",
    );
  });

  it("should parse valid data successfully on first try", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    const { processBatchReconciliation } =
      await import("../../../src/server/workers/batchReconciliationJob");

    const schema = z.object({ name: z.string() });
    const input = [{ llmOutput: '{"name": "Valid Corp"}' }];

    const result = await processBatchReconciliation(input, schema);
    expect(result.successfulExtractions).toEqual([{ name: "Valid Corp" }]);
    expect(result.dlqCount).toBe(0);
    expect(generateContentMock).not.toHaveBeenCalled();
  });

  it("should retry with LLM and succeed if data is invalid initially", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    const { processBatchReconciliation } =
      await import("../../../src/server/workers/batchReconciliationJob");

    const schema = z.object({ name: z.string() });
    const input = [{ llmOutput: '{"wrong_key": "Invalid Corp"}' }];

    generateContentMock.mockResolvedValueOnce({
      text: '{"name": "Corrected Corp"}',
    });

    const result = await processBatchReconciliation(input, schema);
    expect(result.successfulExtractions).toEqual([{ name: "Corrected Corp" }]);
    expect(result.dlqCount).toBe(0);
    expect(generateContentMock).toHaveBeenCalledTimes(1);
  });

  it("should send to DLQ after exceeding MAX_RETRIES", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    const { processBatchReconciliation } =
      await import("../../../src/server/workers/batchReconciliationJob");

    const schema = z.object({ name: z.string() });
    const input = [{ llmOutput: '{"wrong_key": "Invalid Corp"}' }];

    generateContentMock.mockResolvedValue({
      text: '{"wrong_key": "Still Invalid"}',
    });

    const result = await processBatchReconciliation(input, schema);
    expect(result.successfulExtractions).toHaveLength(0);
    expect(result.dlqCount).toBe(1);
    expect(generateContentMock).toHaveBeenCalledTimes(2);
  });

  it("should stop retrying if LLM call throws", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    const { processBatchReconciliation } =
      await import("../../../src/server/workers/batchReconciliationJob");

    const schema = z.object({ name: z.string() });
    const input = [{ llmOutput: '{"wrong_key": "Invalid Corp"}' }];

    generateContentMock.mockRejectedValueOnce(new Error("LLM failure"));

    const result = await processBatchReconciliation(input, schema);

    expect(result.successfulExtractions).toHaveLength(0);
    // Note: in the current implementation, if LLM throws it breaks out of the loop
    // and isValid remains false, so it doesn't get pushed to successfulExtractions.
    // However, it also doesn't get pushed to DLQ because DLQ push only happens when retries === MAX_RETRIES inside catch.
    expect(result.dlqCount).toBe(0);
  });

  it("should handle non-Zod errors", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    const { processBatchReconciliation } =
      await import("../../../src/server/workers/batchReconciliationJob");

    // To trigger a non-Zod error, we can make JSON.parse throw
    const input = [{ llmOutput: "invalid json" }];

    generateContentMock.mockResolvedValue({ text: '{"name": "Valid Now"}' });

    const schema = z.object({ name: z.string() });
    const result = await processBatchReconciliation(input, schema);

    expect(result.successfulExtractions).toEqual([{ name: "Valid Now" }]);
    expect(result.dlqCount).toBe(0);
  });
});
