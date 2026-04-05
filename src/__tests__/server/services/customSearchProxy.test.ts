import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchCustomSearchMetrics } from "../../../server/services/customSearchProxy";
import { GoogleGenAI } from "@google/genai";

vi.mock("@google/genai", () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => {
      return {
        models: {
          generateContent: vi.fn(),
        },
      };
    }),
  };
});

describe("customSearchProxy", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should return zeros if credentials are missing", async () => {
    delete process.env.GEMINI_API_KEY;
    const result = await fetchCustomSearchMetrics("example.com");

    expect(result).toEqual({
      indexation_size: 0,
      sponsored_presence: false,
    });
  });

  it("should return valid search metrics successfully", async () => {
    process.env.GEMINI_API_KEY = "test-key";

    const mockGenerateContent = vi.fn().mockResolvedValue({
      text: JSON.stringify({
        indexationSize: "1500",
        sponsoredAdPresence: true,
      }),
    });

    vi.mocked(GoogleGenAI).mockImplementationOnce(() => {
      return {
        models: {
          generateContent: mockGenerateContent,
        },
      } as any;
    });

    const result = await fetchCustomSearchMetrics("example.com");

    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gemini-3.1-flash",
        config: expect.objectContaining({
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
        }),
      }),
    );

    expect(result).toEqual({
      indexation_size: 1500,
      sponsored_presence: true,
    });
  });

  it("should return valid search metrics when no promotions exist", async () => {
    process.env.GEMINI_API_KEY = "test-key";

    const mockGenerateContent = vi.fn().mockResolvedValue({
      text: JSON.stringify({
        indexationSize: "250",
        sponsoredAdPresence: false,
      }),
    });

    vi.mocked(GoogleGenAI).mockImplementationOnce(() => {
      return {
        models: {
          generateContent: mockGenerateContent,
        },
      } as any;
    });

    const result = await fetchCustomSearchMetrics("example.com");

    expect(result).toEqual({
      indexation_size: 250,
      sponsored_presence: false,
    });
  });

  it("should fallback to 0 if indexationSize is missing or unparseable", async () => {
    process.env.GEMINI_API_KEY = "test-key";

    const mockGenerateContent = vi.fn().mockResolvedValue({
      text: JSON.stringify({
        indexationSize: "abc",
        sponsoredAdPresence: false,
      }),
    });

    vi.mocked(GoogleGenAI).mockImplementationOnce(() => {
      return {
        models: {
          generateContent: mockGenerateContent,
        },
      } as any;
    });

    const result = await fetchCustomSearchMetrics("example.com");

    expect(result.indexation_size).toBeNaN(); // parseInt("abc") is NaN
  });

  it("should fallback gracefully if API call fails", async () => {
    process.env.GEMINI_API_KEY = "test-key";

    const mockGenerateContent = vi
      .fn()
      .mockRejectedValue(new Error("API Timeout"));

    vi.mocked(GoogleGenAI).mockImplementationOnce(() => {
      return {
        models: {
          generateContent: mockGenerateContent,
        },
      } as any;
    });

    const result = await fetchCustomSearchMetrics("example.com");

    expect(result).toEqual({
      indexation_size: 0,
      sponsored_presence: false,
    });
  });

  it("should return 0 if text is null", async () => {
    process.env.GEMINI_API_KEY = "test-key";

    const mockGenerateContent = vi.fn().mockResolvedValue({
      text: null,
    });

    vi.mocked(GoogleGenAI).mockImplementationOnce(() => {
      return {
        models: {
          generateContent: mockGenerateContent,
        },
      } as any;
    });

    const result = await fetchCustomSearchMetrics("example.com");

    expect(result).toEqual({
      indexation_size: 0,
      sponsored_presence: false,
    });
  });
});
