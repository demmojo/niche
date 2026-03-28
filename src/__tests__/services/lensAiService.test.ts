import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  runLensDeepAnalysis,
  generateLensChatResponse,
  LensContext,
} from "../../services/lensAiService";
import { withModelFallback } from "../../utils/aiClient";

vi.mock("../../utils/aiClient", () => ({
  withModelFallback: vi.fn(),
}));

describe("lensAiService", () => {
  const mockContext: LensContext = {
    stats: {
      tracked: 10,
      pricingChanges: 2,
      featuresIndexed: 100,
      topIntegrations: "Slack, Salesforce",
    },
    competitors: [],
    insights: [],
    rawData: [],
    rejectedSuggestions: [],
    chatHistory: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("runLensDeepAnalysis", () => {
    it("should successfully parse valid JSON response", async () => {
      const mockResponse = {
        message: "Analysis complete.",
        options: ["Option 1"],
        suggestions: [
          {
            type: "feature",
            title: "New Feature",
            description: "Desc",
            rationale: "Rationale",
            confidence: "High",
          },
        ],
      };

      vi.mocked(withModelFallback).mockResolvedValue({
        text: JSON.stringify(mockResponse),
      });

      const result = await runLensDeepAnalysis(mockContext);

      expect(result).toEqual(mockResponse);
      expect(withModelFallback).toHaveBeenCalledTimes(1);
    });

    it("should handle invalid JSON and return fallback response", async () => {
      vi.mocked(withModelFallback).mockResolvedValue({
        text: "invalid json string",
      });

      const result = await runLensDeepAnalysis(mockContext);

      expect(result.message).toBe(
        "An error occurred while processing the market data.",
      );
      expect(result.options).toEqual(["Retry analysis"]);
      expect(result.suggestions).toEqual([]);
    });

    it("should handle empty text response", async () => {
      vi.mocked(withModelFallback).mockResolvedValue({
        text: undefined,
      } as any);

      const result = await runLensDeepAnalysis(mockContext);

      expect(result.message).toBe(
        "An error occurred while processing the market data.",
      );
    });
  });

  describe("generateLensChatResponse", () => {
    it("should successfully parse valid JSON response based on user prompt", async () => {
      const mockResponse = {
        message: "Got your input.",
        options: ["Yes", "No"],
        suggestions: [],
      };

      vi.mocked(withModelFallback).mockResolvedValue({
        text: JSON.stringify(mockResponse),
      });

      const result = await generateLensChatResponse(mockContext, "Hello Lens");

      expect(result).toEqual(mockResponse);
      expect(withModelFallback).toHaveBeenCalledTimes(1);
    });
  });
});
