import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { runDeepValidationCampaign } from "../../server/workers/validationCampaignWorker";
import { logger } from "../../server/logger";
import { mlConfigCache } from "../../server/mlConfigCache";
import {
  calculateTarpitScore,
  calculateSquaredOrthogonalDistance,
  fastL2NormalizeInPlace,
  LLMExtractionSchema,
  validateExaUrl,
} from "../../utils/scoringEngine";

const {
  mockFirestore,
  mockUpdate,
  mockDoc,
  mockCollection,
  mockEmbedContent,
  mockGenerateContent,
} = vi.hoisted(() => {
  const mockUpdate = vi.fn();
  const mockDoc = vi.fn(() => ({ update: mockUpdate }));
  const mockCollection = vi.fn(() => ({ doc: mockDoc }));
  const mockFirestore = Object.assign(
    vi.fn(() => ({ collection: mockCollection })),
    {
      FieldValue: {
        serverTimestamp: vi.fn(() => "server-timestamp"),
      },
    },
  );

  const mockEmbedContent = vi.fn();
  const mockGenerateContent = vi.fn();

  return {
    mockFirestore,
    mockUpdate,
    mockDoc,
    mockCollection,
    mockEmbedContent,
    mockGenerateContent,
  };
});

vi.mock("firebase-admin", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    firestore: mockFirestore,
    default: {
      ...(actual.default || {}),
      firestore: mockFirestore,
    },
  };
});

let mockModels: any = {
  embedContent: mockEmbedContent,
  generateContent: mockGenerateContent,
};

vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn(() => ({
    get models() {
      return mockModels;
    },
  })),
}));

vi.mock("../../server/mlConfigCache", () => ({
  mlConfigCache: {
    route: vi.fn(),
  },
}));

vi.mock("../../utils/scoringEngine", () => ({
  calculateTarpitScore: vi.fn(),
  calculateSquaredOrthogonalDistance: vi.fn(),
  fastL2NormalizeInPlace: vi.fn(),
  validateExaUrl: vi.fn(),
  LLMExtractionSchema: {
    safeParse: vi.fn(),
  },
}));

describe("runDeepValidationCampaign", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...originalEnv, GEMINI_API_KEY: "test-api-key" };

    // Default mocks
    mockModels = {
      embedContent: mockEmbedContent,
      generateContent: mockGenerateContent,
    };

    mockEmbedContent.mockResolvedValue({
      embeddings: [{ values: new Array(768).fill(0.1) }],
    });
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({ exa_url: "http://example.com" }),
    });

    vi.mocked(mlConfigCache.route).mockResolvedValue({
      modelParams: {
        model: "test-model",
        embeddingModel: "test-embed",
        temperature: 0.5,
        topP: 0.8,
      },
    } as any);

    vi.mocked(LLMExtractionSchema.safeParse).mockReturnValue({
      success: true,
      data: { exa_url: "http://example.com" },
    } as any);

    vi.mocked(validateExaUrl).mockReturnValue(true);

    vi.mocked(calculateTarpitScore).mockReturnValue({
      status: "success",
      score: 50,
      isTarpit: false,
    });

    vi.mocked(calculateSquaredOrthogonalDistance).mockReturnValue(0.5);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("throws an error if GEMINI_API_KEY is missing", async () => {
    delete process.env.GEMINI_API_KEY;
    await expect(
      runDeepValidationCampaign("job-1", "user-1", [], "base-idea"),
    ).rejects.toThrow("GEMINI_API_KEY is missing");
  });

  it("logs error if ai.models is undefined", async () => {
    mockModels = undefined;
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // It will fail because baseEmbedRes fails when trying to call ai.models.embedContent
    await expect(
      runDeepValidationCampaign("job-1", "user-1", [], "base-idea"),
    ).rejects.toThrow();

    expect(consoleSpy).toHaveBeenCalledWith(
      "ai.models IS UNDEFINED! ai:",
      expect.anything(),
      "GoogleGenAI:",
      expect.anything(),
    );
    consoleSpy.mockRestore();
  });

  it("processes successful enrichments and completes the job", async () => {
    const competitors = [{ domain: "comp1.com", name: "Comp 1" }];
    const baseIdea = { description: "test idea" };

    await runDeepValidationCampaign("job-1", "user-1", competitors, baseIdea);

    expect(mockEmbedContent).toHaveBeenCalledTimes(2); // 1 for comp, 1 for base idea
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        progress: 1,
      }),
    );
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "completed",
        progress: 1,
        results: expect.any(Array),
        scoreResult: expect.any(Object),
      }),
    );
  });

  it("handles fallback defaults when mlConfigCache.route returns null", async () => {
    vi.mocked(mlConfigCache.route).mockResolvedValue(null);
    const competitors = [{ domain: "comp1.com" }];

    await runDeepValidationCampaign(
      "job-1",
      "user-1",
      competitors,
      "base-idea",
    );

    expect(mockEmbedContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gemini-embedding-001",
      }),
    );
    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gemini-3.1-flash",
      }),
    );
  });

  it("handles missing values in competitor embedding", async () => {
    mockEmbedContent.mockResolvedValueOnce({}); // comp embedding
    mockEmbedContent.mockResolvedValueOnce({
      embeddings: [{ values: new Array(768).fill(0.1) }],
    }); // base idea

    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await runDeepValidationCampaign(
      "job-1",
      "user-1",
      [{ domain: "comp1.com" }],
      "base-idea",
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      "TC_ERROR:",
      "Invalid embedding returned from Gemini",
    );
    consoleSpy.mockRestore();
  });

  it("handles invalid embedding length", async () => {
    mockEmbedContent.mockResolvedValueOnce({
      embeddings: [{ values: [0.1, 0.2] }],
    });

    await runDeepValidationCampaign(
      "job-1",
      "user-1",
      [{ domain: "comp1.com" }],
      "base-idea",
    );

    // Result should be empty because the competitor enrichment failed
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "completed",
        results: [],
      }),
    );
  });

  it("handles invalid JSON from LLM", async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: "not json {" });
    const loggerErrorSpy = vi
      .spyOn(logger, "error")
      .mockImplementation(() => {});

    await runDeepValidationCampaign(
      "job-1",
      "user-1",
      [{ domain: "comp1.com" }],
      "base-idea",
    );

    expect(loggerErrorSpy).toHaveBeenCalledWith(
      "Failed to parse LLM Extraction JSON:",
      expect.any(Error),
    );
    loggerErrorSpy.mockRestore();
  });

  it("handles Zod validation failure", async () => {
    vi.mocked(LLMExtractionSchema.safeParse).mockReturnValueOnce({
      success: false,
    } as any);

    await runDeepValidationCampaign(
      "job-1",
      "user-1",
      [{ domain: "comp1.com" }],
      "base-idea",
    );

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "completed",
        results: [],
      }),
    );
  });

  it("handles invalid Exa URL from Zod output", async () => {
    vi.mocked(validateExaUrl).mockReturnValueOnce(false);

    await runDeepValidationCampaign(
      "job-1",
      "user-1",
      [{ domain: "comp1.com" }],
      "base-idea",
    );

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "completed",
        results: [],
      }),
    );
  });

  it("handles missing base idea embedding values", async () => {
    // Base idea is called after competitors
    mockEmbedContent.mockResolvedValueOnce({
      embeddings: [{ values: new Array(768).fill(0.1) }],
    }); // comp
    mockEmbedContent.mockResolvedValueOnce({
      embeddings: [{ values: undefined }],
    }); // base idea fallback to 0.15

    await runDeepValidationCampaign(
      "job-1",
      "user-1",
      [{ domain: "comp1.com" }],
      "base-idea",
    );

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "completed",
        results: expect.arrayContaining([
          expect.objectContaining({ trueCompetitorScore: expect.any(Number) }),
        ]),
      }),
    );
  });

  it("applies wedge override if tarpit and maxWedge > 0.85", async () => {
    vi.mocked(calculateTarpitScore).mockReturnValue({
      status: "success",
      score: 85,
      isTarpit: true,
    });
    // sqrt(0.81) = 0.9 > 0.85
    vi.mocked(calculateSquaredOrthogonalDistance).mockReturnValue(0.81);

    await runDeepValidationCampaign(
      "job-1",
      "user-1",
      [{ domain: "comp1.com" }],
      "base-idea",
    );

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        scoreResult: expect.objectContaining({
          isTarpit: false,
          message: expect.stringContaining(
            "Wedge metric overrides Tarpit score",
          ),
        }),
      }),
    );
  });

  it("updates progress when completedCount % 5 === 0", async () => {
    // 5 competitors to trigger modulo
    const competitors = Array(5).fill({ domain: "comp.com" });

    await runDeepValidationCampaign(
      "job-1",
      "user-1",
      competitors,
      "base-idea",
    );

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        progress: 5,
      }),
    );
  });

  it("handles empty LLM text response", async () => {
    mockGenerateContent.mockResolvedValueOnce({}); // text is undefined
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await runDeepValidationCampaign(
      "job-1",
      "user-1",
      [{ domain: "comp1.com" }],
      "base-idea",
    );

    // Zod validation will fail because `{}` is passed to Zod and it lacks required fields
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "completed",
      }),
    );
    consoleSpy.mockRestore();
  });

  it("handles empty string base idea", async () => {
    // Should fallback to "Base Idea" in contents
    await runDeepValidationCampaign(
      "job-1",
      "user-1",
      [{ domain: "comp1.com" }],
      "",
    );

    expect(mockEmbedContent).toHaveBeenCalledWith(
      expect.objectContaining({
        contents: "Base Idea",
      }),
    );
  });
});
